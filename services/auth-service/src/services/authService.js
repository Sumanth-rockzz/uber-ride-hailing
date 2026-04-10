const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");

class AuthService {
  constructor(userRepo) {
    this.userRepo = userRepo;
  }

  async signup({ name, email, password, role }) {
    const hashed = await bcrypt.hash(password, 10);

    const user = await this.userRepo.createUser({
      name,
      email,
      password: hashed,
      role,
    });

    return user;
  }

  async login({ email, password }) {
    const user = await this.userRepo.getUserByEmail(email);

    if (!user) throw new Error("User not found");

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new Error("Invalid credentials");

    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return { token };
  }
}

module.exports = AuthService;