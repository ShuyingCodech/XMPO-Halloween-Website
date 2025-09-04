import React from "react";
import "../../styles/footer.css";
import {
  InstagramOutlined,
  YoutubeFilled,
  EnvironmentOutlined,
  MailOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { SiXiaohongshu } from "react-icons/si";

const Footer: React.FC = () => {
  const handleInstagramClick = () => {
    window.open(
      "https://www.instagram.com/xmum_philharmonic/?igsh=MWl6ZHNwd3d1NnFsZQ%3D%3D#",
      "_blank"
    );
  };

  const handleYouTubeClick = () => {
    window.open("https://www.youtube.com/@xmum_philharmonic", "_blank");
  };

  const handleEmailClick = () => {
    window.location.href = "mailto:philharmonicorchestraxmum@gmail.com";
  };

  const handleXiaohongshuClick = () => {
    window.open(
      "https://www.xiaohongshu.com/user/profile/610e95240000000001000c5c?xsec_token=YBljYU4VfoI6udlk_WcSJWvulA6DrXNHzFwvxWdPjirOo%3D&xsec_source=app_share&xhsshare=CopyLink&appuid=64b6acd9000000000a020c41&apptime=1756312729&share_id=025da96c8fd04fbbbd32641de59538c7&share_channel=copy_link",
      "_blank"
    );
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-section-icon">
            <EnvironmentOutlined />
          </div>
          <h3>Address</h3>
          <p>
            Xiamen University Malaysia,
            <br />
            Jalan Sunsuria, Bandar Sunsuria,
            <br />
            43900 Sepang, Selangor
          </p>
        </div>

        <div className="footer-section">
          <div className="footer-section-icon">
            <MailOutlined />
          </div>
          <h3>Email</h3>
          <p
            onClick={handleEmailClick}
            style={{ cursor: "pointer" }}
            title="Click to send email"
          >
            philharmonicorchestraxmum@gmail.com
          </p>
        </div>

        <div className="footer-section">
          <div className="footer-section-icon">
            <HeartOutlined />
          </div>
          <h3>Social Media</h3>
          <div className="social-icons">
            <InstagramOutlined
              onClick={handleInstagramClick}
              style={{ cursor: "pointer" }}
            />
            <YoutubeFilled
              onClick={handleYouTubeClick}
              style={{ cursor: "pointer" }}
              title="Visit our YouTube channel"
            />
            {React.createElement(SiXiaohongshu as any, {
              style: { fontSize: "1.5rem", cursor: "pointer" },
              onClick: handleXiaohongshuClick,
              title: "Visit our Xiaohongshu profile",
            })}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © 2025 Xiamen University Malaysia Philharmonic Orchestra. All Rights
          Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
