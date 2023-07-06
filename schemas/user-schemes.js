const Joi = require('joi');

const userRegisterSchema = Joi.object({
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
  subscription: Joi.string(),
});

const userLogInSchema = Joi.object({
  password: Joi.string().min(6).required(),
  email: Joi.string().email().required(),
});

const userEmailSchema = Joi.object({
  email: Joi.string().required().messages({
    'any.required': 'missing required email field',
  }),
});

module.exports = {
  userRegisterSchema,
  userLogInSchema,
  userEmailSchema,
};
