const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation Error', 
      errors: errors.array().map(err => err.msg) 
    });
  }
  next();
};


const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(), 
  
  body('password')
    .trim()
    .notEmpty().withMessage('Password is required'),

  handleValidationErrors
];

module.exports = { validateLogin };