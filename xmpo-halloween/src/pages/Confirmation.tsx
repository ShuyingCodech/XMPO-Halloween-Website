import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/confirmation.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import { Button, notification, Upload } from "antd";
import { DeleteOutlined, UploadOutlined } from "@ant-design/icons";

const Confirmation: React.FC = () => {
  const navigate = useNavigate();
  const [imageUpload, setImageUpload] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    studentId: "",
    email: "",
    contactNo: "",
    paymentReceipt: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData((prev) => ({
        ...prev,
        paymentReceipt: e.target.files![0],
      }));
    }
  };

  const handleConfirm = () => {
    // Validation
    if (!formData.name || !formData.email || !formData.contactNo) {
      alert("Please fill in all required fields");
      return;
    }

    if (!formData.paymentReceipt) {
      alert("Please upload payment receipt");
      return;
    }

    // Save to database or send to backend
    console.log("Form submitted:", formData);

    // Clear session storage
    sessionStorage.removeItem("ticketData");

    // Navigate to success page or home
    alert("Booking confirmed! You will receive a confirmation email shortly.");
    navigate("/");
  };

  const handleFileChange = (info: any) => {
    if (info.fileList.length > 0) {
      /* If you're using Ant Design's Upload component, make sure you're correctly accessing the originFileObj from info.fileList when handling the upload.**/
      setImageUpload(info.fileList[0].originFileObj);
    } else {
      setImageUpload(null);
    }
  };

  return (
    <>
      <Header />
      <div className="confirmation-page">
        <div className="confirmation-container">
          <form className="confirmation-form">
            <div className="form-group">
              <label htmlFor="name">Name (as per NRIC)</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="studentId">Student ID</label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                value={formData.studentId}
                onChange={handleInputChange}
                placeholder="* only for XMUM students"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactNo">Contact No</label>
              <input
                type="tel"
                id="contactNo"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="paymentReceipt">Upload Payment Receipt</label>
              <div className="file-upload">
                <input
                  type="file"
                  id="paymentReceipt"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                />
                <Upload
                  id="receipt"
                  beforeUpload={(imageUpload) => {
                    const validTypes = ["image/png", "image/jpg", "image/jpeg"];
                    if (!validTypes.includes(imageUpload.type)) {
                      notification.error({
                        message: "Invalid file type",
                        description:
                          "Please upload a file of type PNG, JPG, or JPEG!",
                      });
                      return Upload.LIST_IGNORE;
                    }
                    return false;
                  }}
                  onRemove={() => {
                    setImageUpload(null);
                    // sessionStorage.setItem("file", "");
                  }}
                  onChange={handleFileChange}
                  maxCount={1}
                  showUploadList={{
                    extra: ({ size = 0 }) => (
                      <span style={{ color: "#cccccc" }}>
                        ({(size / 1024 / 1024).toFixed(2)}MB)
                      </span>
                    ),
                    showRemoveIcon: true,
                    removeIcon: <DeleteOutlined style={{ color: "white" }} />,
                  }}
                >
                  <Button icon={<UploadOutlined />}>Upload</Button>
                </Upload>
                {formData.paymentReceipt && (
                  <span className="file-name">
                    {formData.paymentReceipt.name}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="confirm-btn"
              onClick={handleConfirm}
            >
              Confirm
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Confirmation;
