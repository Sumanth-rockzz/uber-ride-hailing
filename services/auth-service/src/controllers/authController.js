class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  signup = async (req, res) => {
    try {
      const user = await this.authService.signup(req.body);
      res.json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };

  login = async (req, res) => {
    try {
      const result = await this.authService.login(req.body);
      res.json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  };
}

module.exports = AuthController;