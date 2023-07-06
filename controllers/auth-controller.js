const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const fs = require('fs/promises');
const gravatar = require('gravatar');
const path = require('path');
const Jimp = require('jimp');
const { nanoid } = require('nanoid');

const { SECRET_KEY, BASE_URL } = process.env;

const User = require('../models/users');

const { HttpError, sentEmail } = require('../helpers');
const sendEmail = require('../helpers/sentEmail');
const avatarsDir = path.resolve('public', 'avatars');

const signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user) {
      throw HttpError(409, 'Email in use');
    }

    const avatarURL = gravatar.url(email, {
      s: '200',
      r: 'pg',
      d: 'identicon',
      protocol: 'https',
    });

    const verificationToken = nanoid();

    const hashPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      ...req.body,
      avatarURL,
      password: hashPassword,
      verificationToken,
    });

    const verifyEmail = {
      to: email,
      subject: 'Verify email',
      html: `<a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click verify email</a>`,
    };

    await sentEmail(verifyEmail);

    res.status(201).json({
      user: {
        email: newUser.email,
        subscription: 'starter',
        avatarURL,
      },
    });

    return;
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  try {
    const { verificationToken } = req.params;
    const user = await User.findOne({ verificationToken });

    if (!user) {
      throw HttpError(404, 'User not found');
    }

    if (user.verify) {
      throw HttpError(400, 'Verification has already been passed');
    }

    await User.findByIdAndUpdate(user._id, {
      verify: true,
      verificationToken: '',
    });

    res.status(200).json({
      message: 'Verification successful',
    });
  } catch (error) {
    next(error);
  }
};

const resendVerifyEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      throw HttpError(401);
    }

    if (user.verify) {
      throw HttpError(400, 'Verification has already been passed');
    }

    const verifyEmail = {
      to: email,
      subject: 'Verify email',
      html: `<a target="_blank" href="${BASE_URL}/users/verify/${user.verificationToken}">Click verify email</a>`,
    };

    await sendEmail(verifyEmail);

    res.status(200).json({
      message: 'Verification email sent',
    });
  } catch (error) {
    next(error);
  }
};

const signIn = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw HttpError(401, 'Email or password is wrong');
    }

    if (!user.verify) {
      throw HttpError(404, 'User not found');
    }

    const passwordCompare = await bcrypt.compare(password, user.password);
    if (!passwordCompare) {
      throw HttpError(401, 'Email or password is wrong');
    }

    const { _id: id } = user;
    const payload = {
      id,
    };
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '23h' });
    await User.findByIdAndUpdate(id, { token });

    res.status(200).json({
      token: token,
      user: {
        email: email,
        subscription: 'starter',
      },
    });
  } catch (error) {
    next(HttpError(401, 'Email or password is wrong'));
  }
};

const getCurrent = async (req, res, next) => {
  try {
    const { email } = req.user;

    if (!req.user) {
      throw HttpError(401, 'Not authorized');
    }

    res.status(200).json({
      email: email,
      subscription: 'starter',
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const { _id } = req.user;

    console.log(req.user);

    const user = await User.findByIdAndUpdate(_id, { token: '' });

    if (!user || !user.token) {
      throw HttpError(401, 'Not authorized');
    }

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

const updateAvatar = async (req, res) => {
  const { _id } = req.user;
  const { path: oldPath, filename } = req.file;
  const newPath = path.join(avatarsDir, filename);
  await Jimp.read(oldPath)
    .then((avatar) => {
      return avatar.resize(250, 250).write(oldPath);
    })
    .catch((err) => {
      console.error(err);
    });
  await fs.rename(oldPath, newPath);
  const avatarURL = path.join('avatars', filename);

  await User.findByIdAndUpdate(_id, { avatarURL });
  res.status(200).json({ avatarURL });
};

module.exports = {
  signup,
  signIn,
  getCurrent,
  logout,
  updateAvatar,
  verify,
  resendVerifyEmail,
};
