const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const prisma = require('../config/database');
const { isDisposableEmail } = require('../utils/disposableEmails');
const { generateToken, getTokenExpiry } = require('../utils/tokenUtils');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');

/**
 * Register a new user.
 */
async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    // Check disposable email
    if (isDisposableEmail(email)) {
      return res.status(400).json({ error: 'Disposable email addresses are not allowed' });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const verifyToken = generateToken();
    const verifyTokenExp = getTokenExpiry(24); // 24 hours

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        verifyToken,
        verifyTokenExp,
      },
    });

    // Create default accounts
    await prisma.account.createMany({
      data: [
        { userId: user.id, name: 'Bank Account', type: 'bank' },
        { userId: user.id, name: 'Cash In Hand', type: 'cash' },
      ],
    });

    // Send verification email (non-blocking)
    // If email fails (e.g. Render blocks SMTP), auto-verify the account
    sendVerificationEmail(email.toLowerCase(), verifyToken).catch(async (err) => {
      console.error('Email send failed:', err.message);
      console.log('⚡ Auto-verifying account since email could not be sent');
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true, verifyToken: null, verifyTokenExp: null },
      });
    });

    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

/**
 * Verify email address.
 */
async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' });
    }

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExp: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
    });

    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}

/**
 * Login user.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.emailVerified) {
      return res.status(403).json({ 
        error: 'Please verify your email before logging in',
        needsVerification: true,
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

/**
 * Logout user.
 */
async function logout(req, res) {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
}

/**
 * Get current user profile.
 */
async function getProfile(req, res) {
  res.json({ user: req.user });
}

/**
 * Forgot password - send reset email.
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
    }

    const resetToken = generateToken();
    const resetTokenExp = getTokenExpiry(1); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    sendPasswordResetEmail(email.toLowerCase(), resetToken).catch(err => console.error('Email send failed:', err.message));

    res.json({ message: 'If an account exists with this email, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
}

/**
 * Reset password using token.
 */
async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gte: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
}

/**
 * Resend verification email.
 */
async function resendVerification(req, res) {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || user.emailVerified) {
      return res.json({ message: 'If the account exists and is unverified, a new verification email has been sent.' });
    }

    const verifyToken = generateToken();
    const verifyTokenExp = getTokenExpiry(24);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExp },
    });

    sendVerificationEmail(email.toLowerCase(), verifyToken).catch(err => console.error('Email send failed:', err.message));

    res.json({ message: 'If the account exists and is unverified, a new verification email has been sent.' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  resendVerification,
};
