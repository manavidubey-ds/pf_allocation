// Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // 🔸 Import useNavigate
import "./Login.css";
import eyeOpen from "../assets/eyeopen.png";
import eyeClose from "../assets/eyeclose.png";
import illustration from "../assets/illustration.png";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // 🔸 Hook to navigate

  const handleLogin = (e) => {
    e.preventDefault();

    // (Optional) Add form validation or authentication logic here

    navigate("/dashboard"); // 🔸 Navigate to Dashboard
  };

  return (
    <div className="login-container">
      <div className="login-form-section">
        <h1 className="app-title">PF Allocation Tool</h1>
        <h2 className="login-title">Log In</h2>

        <button className="google-button">
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="google-icon"
          />
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <label>Email Address</label>
          <input type="email" placeholder="example@gmail.com" required />

          <label>Password</label>
          <div className="password-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              required
            />
            <img
              src={showPassword ? eyeClose : eyeOpen}
              alt="Toggle visibility"
              className="eye-icon"
              onClick={() => setShowPassword((prev) => !prev)}
            />
          </div>

          <div className="options-row">
            <label>
              <input type="checkbox" /> Remember me
            </label>
            <a href="#" className="reset-link">Reset Password?</a>
          </div>

          <button type="submit" className="login-btn">Log In</button>
        </form>

        <p className="signup-text">
          Don’t have account yet? <a href="#">New Account</a>
        </p>
      </div>

      <div className="illustration-section">
        <img src={illustration} alt="Illustration" />
      </div>
    </div>
  );
};

export default Login;
