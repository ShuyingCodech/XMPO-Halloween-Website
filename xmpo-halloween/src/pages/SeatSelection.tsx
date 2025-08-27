import React, { useEffect, useState } from "react";
import "../styles/seatSelection.css";
import { useNavigate } from "react-router-dom";
import { DoubleRightOutlined } from "@ant-design/icons";
import { notification } from "antd";
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
    Normal1: { startRow: 2, endRow: 4, color: "normal" },
    Deluxe: { startRow: 5, endRow: 9, color: "deluxe" },
    Normal2: { startRow: 10, endRow: 18, color: "normal" },
  };

  const seatPrices = { Deluxe: 40, Normal1: 20, Normal2: 20 };

  // Helper function to get row number from seat code
  const getRowNumber = (seatCode: string) => {
    const parts = seatCode.split("-");
    return parseInt(parts[0]);
  };

  const getZoneType = (seatCode: string) => {
    const row = getRowNumber(seatCode);

    if (row >= 5 && row <= 9) return "Deluxe";
    return "Normal";
  };

  // Group selected seats by zone type
  const getSelectedSeatsByZone = () => {
    const deluxeSeats = selectedSeats.filter(
      (seat) => getZoneType(seat) === "Deluxe"
    );
    const normalSeats = selectedSeats.filter(
      (seat) => getZoneType(seat) === "Normal"
    );

    return {
      deluxe: deluxeSeats,
      normal: normalSeats,
    };
  };

  // Check if normal tickets are available (for packages)
  const hasNormalTickets = () => {
    return getSelectedSeatsByZone().normal.length > 0;
  };

  const packages = [
    {
      id: "A1",
      name: "Package A1",
      available: hasNormalTickets(),
    },
    {
      id: "A2",
      name: "Package A2",
      available: hasNormalTickets(),
    },
    {
      id: "B",
      name: "Package B",
      available: hasNormalTickets(),
    },
    {
      id: "C",
      name: "Package C",
      available: hasNormalTickets(),
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
      setSelectedPackages(data.selectedPackages || []);
    }
  }, []);

  // Helper function to get seat number from seat code
  const getSeatNumber = (seatCode: string) => {
    const parts = seatCode.split("-");
    return parseInt(parts[1]);
  };

  // Validation function to check for odd empty seats - now used for payment validation
  const validateAllSeatSelections = (): {
    isValid: boolean;
    invalidRows: number[];
  } => {
    const invalidRows: number[] = [];

    // Get all rows that have selected seats
    const rowsWithSelections = new Set<number>();
    selectedSeats.forEach((seat) => {
      rowsWithSelections.add(getRowNumber(seat));
    });

    // Check each row with selections
    for (const targetRow of Array.from(rowsWithSelections)) {
      const rowSeatCount = seatCounts[targetRow as keyof typeof seatCounts];

      // Generate the actual seat arrangement for this row
      const evenNumbers = [];
      const oddNumbers = [];
      for (let seat = rowSeatCount; seat >= 1; seat--) {
        if (seat % 2 === 0) evenNumbers.push(seat);
        else oddNumbers.push(seat);
      }
      const allSeatsInRow = [...evenNumbers, ...oddNumbers.reverse()];

      // Get all occupied seats in this row (both selected and reserved)
      const occupiedSeats = new Set<number>();

      // Add reserved seats in this row
      reservedSeats.forEach((seat) => {
        if (getRowNumber(seat) === targetRow) {
          occupiedSeats.add(getSeatNumber(seat));
        }
      });

      // Add currently selected seats in this row
      selectedSeats.forEach((seat) => {
        if (getRowNumber(seat) === targetRow) {
          occupiedSeats.add(getSeatNumber(seat));
        }
      });

      // Create a boolean array representing occupied status in visual order
      const seatOccupied = allSeatsInRow.map((seatNum) =>
        occupiedSeats.has(seatNum)
      );

      // Find all groups of consecutive empty seats
      const emptyGroups = [];
      let currentGroupStart = -1;
      let currentGroupSize = 0;

      for (let i = 0; i < seatOccupied.length; i++) {
        if (!seatOccupied[i]) {
          // Empty seat found
          if (currentGroupStart === -1) {
            currentGroupStart = i;
            currentGroupSize = 1;
          } else {
            currentGroupSize++;
          }
        } else {
          // Occupied seat found, end current group if exists
          if (currentGroupStart !== -1) {
            emptyGroups.push({
              start: currentGroupStart,
              size: currentGroupSize,
            });
            currentGroupStart = -1;
            currentGroupSize = 0;
          }
        }
      }

      // Don't forget the last group if it ends at the row edge
      if (currentGroupStart !== -1) {
        emptyGroups.push({
          start: currentGroupStart,
          size: currentGroupSize,
        });
      }

      // Check if any empty group has odd size and is between occupied seats
      for (const group of emptyGroups) {
        const hasLeftNeighbor =
          group.start > 0 && seatOccupied[group.start - 1];
        const hasRightNeighbor =
          group.start + group.size < seatOccupied.length &&
          seatOccupied[group.start + group.size];

        // If the empty group is between two occupied seats and has odd size, it's invalid
        if (hasLeftNeighbor && hasRightNeighbor && group.size % 2 === 1) {
          invalidRows.push(targetRow);
          break; // No need to check more groups in this row
        }
      }
    }

    return {
      isValid: invalidRows.length === 0,
      invalidRows: invalidRows,
    };
  };

  const handleSeatClick = (row: number, seat: number) => {
    const seatCode = `${row < 10 ? `0${row}` : row}-${
      seat < 10 ? `0${seat}` : seat
    }`;
    const isSelected = selectedSeats.includes(seatCode);

    let updatedSeats;
    let updatedPrice = totalPrice;

    // Determine zone type and pricing
    const zoneType = getZoneType(seatCode);
    const price =
      zoneType === "Deluxe" ? seatPrices.Deluxe : seatPrices.Normal1;

    if (isSelected) {
      updatedSeats = selectedSeats.filter((s) => s !== seatCode);
      updatedPrice -= price;
    } else {
      updatedSeats = [...selectedSeats, seatCode];
      updatedPrice += price;
    }

    // No validation here anymore - just update the selection
    setSelectedSeats(updatedSeats);
    setTotalPrice(updatedPrice);

    const ticketData = {
      selectedSeats: updatedSeats,
      totalPrice: updatedPrice,
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
      selectedPackages: updatedPackages,
    };
    sessionStorage.setItem("ticketData", JSON.stringify(ticketData));
  };

  const handleContinueToPayment = () => {
    if (selectedSeats.length === 0) {
      notification.error({
        message: "No Seats Selected",
        description:
          "Please select at least one seat before continuing to payment.",
        duration: 3,
      });
      return;
    }

    // Validate seat selections before proceeding
    const validation = validateAllSeatSelections();

    if (!validation.isValid) {
      const rowsText =
        validation.invalidRows.length === 1
          ? `row ${validation.invalidRows[0]}`
          : `rows ${validation.invalidRows.join(", ")}`;

      notification.error({
        message: "Invalid Seat Selection",
        description: `You cannot leave an ODD number of empty seats between occupied seats in ${rowsText}. Please adjust your seat selection.`,
        duration: 8,
      });
      return;
    }

    // If validation passes, proceed to payment
    navigate("/payment");
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
        const seatCode = `${row < 10 ? `0${row}` : row}-${
          seatNum < 10 ? `0${seatNum}` : seatNum
        }`;
        const isSelected = selectedSeats.includes(seatCode);
        const isReserved = reservedSeats.includes(seatCode) || isFirstOrLastRow;
        const isDisabled =
          (row === 12 || row === 13) && seatNum >= 1 && seatNum <= 3;

        const seatColor =
          zone && zones[zone as keyof typeof zones]
            ? zones[zone as keyof typeof zones].color
            : "normal";

        return (
          <div
            key={seatCode}
            className={`seat ${seatColor} ${isSelected ? "selected" : ""} ${
              isReserved || isDisabled ? "reserved" : ""
            }`}
            onClick={() =>
              !(isReserved || isDisabled) && handleSeatClick(row, seatNum)
            }
            style={isReserved || isDisabled ? { cursor: "not-allowed" } : {}}
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

    generateSeatRow(1, false); // VIP row - not reserved anymore
    for (let row = 2; row <= 17; row++) {
      generateSeatRow(row, false);
    }
    generateSeatRow(18, true); // Still reserved

    return seatRows;
  };

  const { deluxe: deluxeSeats, normal: normalSeats } = getSelectedSeatsByZone();

  return (
    <>
      <Header />
      <div className="seat-selection-page">
        <div className="content-container">
          <div className="left-section">
            <h4>Select Seats</h4>
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
                <span className="seat deluxe"></span> Deluxe &nbsp; [RM
                {seatPrices["Deluxe"]}]
              </div>
              <div style={{ marginBottom: "20px" }}>
                <span className="seat normal"></span> Normal &nbsp; [RM
                {seatPrices["Normal1"]}]
              </div>
              <div style={{ marginBottom: "20px" }}>
                <span className="seat selected"></span> Selected
              </div>
              <div style={{ marginBottom: "20px" }}>
                <span className="seat reserved"></span> Occupied/Disabled
              </div>
            </div>
          </div>

          <div className="right-section">
            <div className="seats-selected">
              <h5>Seats Selected</h5>

              {deluxeSeats.length > 0 && (
                <div className="ticket-type-display">
                  <div className="ticket-type-header ticket-row">
                    <span className="ticket-type-label">
                      Deluxe x {deluxeSeats.length}
                    </span>
                    <div className="selected-seats-display">
                      {deluxeSeats.map((seat, index) => (
                        <span key={seat}>
                          {seat}
                          {index < deluxeSeats.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {normalSeats.length > 0 && (
                <div className="ticket-type-display">
                  <div className="ticket-type-header ticket-row">
                    <span className="ticket-type-label">
                      Normal x {normalSeats.length}
                    </span>
                    <div className="selected-seats-display">
                      {normalSeats.map((seat, index) => (
                        <span key={seat}>
                          {seat}
                          {index < normalSeats.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedSeats.length === 0 && (
                <div className="selected-seats-display">
                  <p>No seats selected</p>
                </div>
              )}
            </div>

            {/* <div className="bundles-section">
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
            </div> */}

            <div className="total-price">
              <h6>Total: RM {totalPrice}</h6>
            </div>

            <button
              className="continue-payment-btn"
              disabled={selectedSeats.length === 0}
              onClick={handleContinueToPayment}
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
