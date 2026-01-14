const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const validatePassword = (password) => {
  if (!passwordRegex.test(password)) {
    return {
      valid: false,
      message:
        "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
    };
  }

  return { valid: true };
};

module.exports = { validatePassword };
