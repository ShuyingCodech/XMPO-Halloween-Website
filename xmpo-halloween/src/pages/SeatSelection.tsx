import React, { useEffect, useState } from "react";
import "../styles/seatSelection.css";
import { useNavigate } from "react-router-dom";
import { DoubleRightOutlined } from "@ant-design/icons";
// import { firestore } from "../firebase";
// import { collection, getDocs } from "firebase/firestore";
import "../styles/common.css";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const SeatSelection: React.FC = () => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [ticketType, setTicketType] = useState<"deluxe" | "normal">("deluxe");
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const navigate = useNavigate();

  const seatCounts = {
    1: 34,
    2: 35,
    3: 34,
    4: 35,
    5: 34,
    6: 35,
    7: 34,
    8: 35,
    9: 34,
    10: 35,
    11: 34,
    12: 35,
    13: 34,
    14: 35,
    15: 34,
    16: 35,
    17: 30,
    18: 25,
  };

  const zones = {
    R1: { startRow: 1, endRow: 1, color: "reserved" },
    A: { startRow: 2, endRow: 7, color: "red" },
    B: { startRow: 8, endRow: 12, color: "blue" },
    C: { startRow: 13, endRow: 17, color: "green" },
    R2: { startRow: 18, endRow: 18, color: "reserved" },
  };

  const deluxePrices = { A: 40, B: 30, C: 25 };
  const normalPrices = { A: 35, B: 25, C: 20 };

  const packages = [
    {
      id: "A1",
      name: "Package A1",
      available: ticketType === "normal" && selectedSeats.length >= 1,
    },
    {
      id: "A2",
      name: "Package A2",
      available: ticketType === "normal" && selectedSeats.length >= 1,
    },
    {
      id: "B",
      name: "Package B",
      available: ticketType === "normal" && selectedSeats.length >= 1,
    },
    {
      id: "C",
      name: "Package C",
      available: ticketType === "normal" && selectedSeats.length >= 1,
    },
  ];

  const fetchReservedSeats = async () => {
    const reservedSeats: string[] = [];
    try {
      //   const querySnapshot = await getDocs(collection(firestore, "payments"));
      //   querySnapshot.forEach((doc) => {
      //     const data = doc.data();
      //     reservedSeats.push(...(data.selectedSeats || []));
      //   });
    } catch (error) {
      console.error("Error fetching reserved seats: ", error);
    } finally {
      setLoading(false);
    }
    return reservedSeats;
  };

  useEffect(() => {
    const loadReservedSeats = async () => {
      const reserved = await fetchReservedSeats();
      setReservedSeats(reserved);
    };
    loadReservedSeats();

    const storedData = sessionStorage.getItem("ticketData");
    if (storedData) {
      const data = JSON.parse(storedData);
      setSelectedSeats(data.selectedSeats || []);
      setTotalPrice(data.totalPrice || 0);
      setTicketType(data.ticketType || "deluxe");
      setSelectedPackages(data.selectedPackages || []);
    }
  }, []);

  const currentPrices = ticketType === "deluxe" ? deluxePrices : normalPrices;

  const handleSeatClick = (zone: string, row: number, seat: number) => {
    const seatCode = `${zone}${row}-${seat < 10 ? `0${seat}` : seat}`;
    const isSelected = selectedSeats.includes(seatCode);

    let updatedSeats;
    let updatedPrice = totalPrice;

    if (isSelected) {
      updatedSeats = selectedSeats.filter((s) => s !== seatCode);
      updatedPrice -= currentPrices[zone as keyof typeof currentPrices];
    } else {
      updatedSeats = [...selectedSeats, seatCode];
      updatedPrice += currentPrices[zone as keyof typeof currentPrices];
    }

    setSelectedSeats(updatedSeats);
    setTotalPrice(updatedPrice);

    const ticketData = {
      selectedSeats: updatedSeats,
      totalPrice: updatedPrice,
      ticketType,
      selectedPackages,
    };
    sessionStorage.setItem("ticketData", JSON.stringify(ticketData));
  };

  const handleTicketTypeChange = (type: "deluxe" | "normal") => {
    setTicketType(type);
    // Recalculate price based on new type
    const newPrices = type === "deluxe" ? deluxePrices : normalPrices;
    const newTotalPrice = selectedSeats.reduce((total, seat) => {
      const zone = seat.charAt(0);
      return total + newPrices[zone as keyof typeof newPrices];
    }, 0);

    setTotalPrice(newTotalPrice);

    const ticketData = {
      selectedSeats,
      totalPrice: newTotalPrice,
      ticketType: type,
      selectedPackages,
    };
    sessionStorage.setItem("ticketData", JSON.stringify(ticketData));
  };

  const handlePackageToggle = (packageId: string) => {
    const updatedPackages = selectedPackages.includes(packageId)
      ? selectedPackages.filter((p) => p !== packageId)
      : [...selectedPackages, packageId];

    setSelectedPackages(updatedPackages);

    const ticketData = {
      selectedSeats,
      totalPrice,
      ticketType,
      selectedPackages: updatedPackages,
    };
    sessionStorage.setItem("ticketData", JSON.stringify(ticketData));
  };

  const generateSeatNumbers = (rowCount: number) => {
    const evenNumbers = [];
    const oddNumbers = [];
    for (let seat = rowCount; seat >= 1; seat--) {
      if (seat % 2 === 0) evenNumbers.push(seat);
      else oddNumbers.push(seat);
    }
    return [...evenNumbers, ...oddNumbers.reverse()];
  };

  const renderSeats = () => {
    const seatRows: React.ReactElement[] = [];

    const generateSeatRow = (row: number, isFirstOrLastRow: boolean) => {
      const zone = Object.keys(zones).find(
        (key) =>
          row >= zones[key as keyof typeof zones].startRow &&
          row <= zones[key as keyof typeof zones].endRow
      );

      const seatNumbers = generateSeatNumbers(
        seatCounts[row as keyof typeof seatCounts]
      );

      const seatRow = seatNumbers.map((seatNum) => {
        const seatCode = `${zone}${row}-${
          seatNum < 10 ? `0${seatNum}` : seatNum
        }`;
        const isSelected = selectedSeats.includes(seatCode);
        const isReserved = reservedSeats.includes(seatCode) || isFirstOrLastRow;

        return (
          <div
            key={seatCode}
            className={`seat ${zones[zone as keyof typeof zones].color} ${
              isSelected ? "selected" : ""
            } ${isReserved ? "reserved" : ""}`}
            onClick={() => !isReserved && handleSeatClick(zone!, row, seatNum)}
            style={isReserved ? { cursor: "not-allowed" } : {}}
          >
            {!isFirstOrLastRow && seatNum}
          </div>
        );
      });

      seatRows.push(
        <div key={row} className="seat-row">
          <div className="row-label">Row {row}</div>
          <div className="seat-wrapper">{seatRow}</div>
        </div>
      );
    };

    generateSeatRow(1, true);
    for (let row = 2; row <= 17; row++) {
      generateSeatRow(row, false);
    }
    generateSeatRow(18, true);

    return seatRows;
  };

  return (
    <>
      <Header />
      <div className="seat-selection-page">
        <div className="content-container">
          <div className="left-section">
            <h2>Seat Selection</h2>
            <p>(same as bloom in motion)</p>
            <div className="stage">STAGE</div>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <>
                <div className="seating-chart">{renderSeats()}</div>
                <span className="swipe-hint">
                  <DoubleRightOutlined />
                  &nbsp; Swipe left for more
                </span>
              </>
            )}

            <div className="legend">
              <div style={{ marginBottom: "20px" }}>
                <span className="seat red"></span> Zone A &nbsp; [RM
                {currentPrices["A"]}]
              </div>
              <div style={{ marginBottom: "20px" }}>
                <span className="seat blue"></span> Zone B &nbsp; [RM
                {currentPrices["B"]}]
              </div>
              <div style={{ marginBottom: "20px" }}>
                <span className="seat green"></span> Zone C &nbsp; [RM
                {currentPrices["C"]}]
              </div>
              <div style={{ marginBottom: "20px" }}>
                <span className="seat selected"></span> Selected
              </div>
              <div style={{ marginBottom: "20px" }}>
                <span className="seat reserved"></span> Occupied
              </div>
            </div>

            <div className="validation-note">
              <p>📋 If possible, add validation to avoid leaving empty seat</p>
            </div>
          </div>

          <div className="right-section">
            <div className="seats-selected">
              <h3>Seats Selected</h3>
              <div className="ticket-types">
                <div
                  className={`ticket-type ${
                    ticketType === "deluxe" ? "active" : ""
                  }`}
                  onClick={() => handleTicketTypeChange("deluxe")}
                >
                  <span>Deluxe</span>
                  <span>
                    x {ticketType === "deluxe" ? selectedSeats.length : 0}
                  </span>
                </div>
                <div
                  className={`ticket-type ${
                    ticketType === "normal" ? "active" : ""
                  }`}
                  onClick={() => handleTicketTypeChange("normal")}
                >
                  <span>Normal</span>
                  <span>
                    x {ticketType === "normal" ? selectedSeats.length : 0}
                  </span>
                </div>
              </div>

              <div className="selected-seats-display">
                {selectedSeats.map((seat, index) => (
                  <span key={seat}>
                    {seat}
                    {index < selectedSeats.length - 1 ? ", " : ""}
                  </span>
                ))}
              </div>
            </div>

            <div className="bundles-section">
              <h3>Bundles</h3>

              <div className="bundle-item">
                <input
                  type="checkbox"
                  id="ticket-only"
                  checked={selectedPackages.length === 0}
                  onChange={() => setSelectedPackages([])}
                />
                <label htmlFor="ticket-only">Ticket only</label>
              </div>

              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`bundle-item ${!pkg.available ? "disabled" : ""}`}
                >
                  <input
                    type="checkbox"
                    id={pkg.id}
                    checked={selectedPackages.includes(pkg.id)}
                    onChange={() => handlePackageToggle(pkg.id)}
                    disabled={!pkg.available}
                  />
                  <label htmlFor={pkg.id}>{pkg.name} ( details... )</label>
                </div>
              ))}

              <div className="package-note">
                <p>option only available if normal ticket ≥ 1</p>
              </div>
            </div>

            <button
              className="continue-payment-btn"
              disabled={selectedSeats.length === 0}
              onClick={() => navigate("/payment")}
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default SeatSelection;
