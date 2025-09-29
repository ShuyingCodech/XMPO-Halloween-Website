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
import { getReservedSeats } from "../services/firebaseService";
import { checkEarlyBirdStatus } from "../utils/common";

const SeatSelection: React.FC = () => {
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [reservedSeats, setReservedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPrice, setTotalPrice] = useState(0);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [isEarlyBird, setIsEarlyBird] = useState(true);
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
    Standard1: { startRow: 2, endRow: 4, color: "normal" },
    Deluxe: { startRow: 5, endRow: 9, color: "deluxe" },
    Standard2: { startRow: 10, endRow: 18, color: "normal" },
  };

  const seatPrices = {
    Deluxe: {
      original: 45,
      earlyBird: 40,
      bundleOriginal: 42, // 6 for RM252 (1 for RM42)
      bundleEarlyBird: 42, // Same price for bundle
    },
    Standard1: {
      original: 25,
      earlyBird: 20,
      bundleOriginal: 22, // 6 for RM132 (1 for RM22)
      bundleEarlyBird: 22, // Same price for bundle
    },
    Standard2: {
      original: 25,
      earlyBird: 20,
      bundleOriginal: 22, // 6 for RM132 (1 for RM22)
      bundleEarlyBird: 22, // Same price for bundle
    },
  };

  // Function to get current price based on early bird status and bundle eligibility
  const getCurrentPrice = (zoneType: string, seatCount: number) => {
    const isBundle = seatCount >= 6;

    if (zoneType === "Deluxe") {
      if (isBundle) {
        return isEarlyBird
          ? seatPrices.Deluxe.bundleEarlyBird
          : seatPrices.Deluxe.bundleOriginal;
      }
      return isEarlyBird
        ? seatPrices.Deluxe.earlyBird
        : seatPrices.Deluxe.original;
    }

    if (isBundle) {
      return isEarlyBird
        ? seatPrices.Standard1.bundleEarlyBird
        : seatPrices.Standard1.bundleOriginal;
    }
    return isEarlyBird
      ? seatPrices.Standard1.earlyBird
      : seatPrices.Standard1.original;
  };

  // Function to recalculate total price when early bird status changes
  const recalculatePrice = (seats: string[], earlyBirdStatus: boolean) => {
    const { deluxe: deluxeSeats, normal: normalSeats } =
      getSelectedSeatsByZone(seats);

    const deluxePrice = getCurrentPrice("Deluxe", deluxeSeats.length);
    const standardPrice = getCurrentPrice("Standard", normalSeats.length);

    return (
      deluxeSeats.length * deluxePrice + normalSeats.length * standardPrice
    );
  };

  // Set up interval to check early bird status
  useEffect(() => {
    // const updateEarlyBirdStatus = () => {
    //   const newEarlyBirdStatus = checkEarlyBirdStatus();
    //   if (newEarlyBirdStatus !== isEarlyBird) {
    //     setIsEarlyBird(newEarlyBirdStatus);

    //     // Recalculate price with new status
    //     const newPrice = recalculatePrice(selectedSeats, newEarlyBirdStatus);
    //     setTotalPrice(newPrice);

    //     // Update session storage
    //     const ticketData = {
    //       selectedSeats,
    //       totalPrice: newPrice,
    //       selectedPackages,
    //     };
    //     sessionStorage.setItem("ticketData", JSON.stringify(ticketData));
    //   }
    // };

    // // Check immediately
    // updateEarlyBirdStatus();

    // Check every minute
    // const interval = setInterval(updateEarlyBirdStatus, 60000);

    // return () => clearInterval(interval);
  }, [isEarlyBird, selectedSeats, selectedPackages]);

  // Helper function to get row number from seat code
  const getRowNumber = (seatCode: string) => {
    const parts = seatCode.split("-");
    return parseInt(parts[0]);
  };

  const getZoneType = (seatCode: string) => {
    const row = getRowNumber(seatCode);

    if (row >= 5 && row <= 9) return "Deluxe";
    return "Standard";
  };

  // Group selected seats by zone type - modified to accept seats parameter
  const getSelectedSeatsByZone = (seats: string[] = selectedSeats) => {
    const deluxeSeats = seats.filter((seat) => getZoneType(seat) === "Deluxe");
    const normalSeats = seats.filter(
      (seat) => getZoneType(seat) === "Standard"
    );

    return {
      deluxe: deluxeSeats,
      normal: normalSeats,
    };
  };

  // Check if normal tickets are available (for packages)
  const hasStandardTickets = () => {
    return getSelectedSeatsByZone().normal.length > 0;
  };

  const packages = [
    {
      id: "A1",
      name: "Package A1",
      available: hasStandardTickets(),
    },
    {
      id: "A2",
      name: "Package A2",
      available: hasStandardTickets(),
    },
    {
      id: "B",
      name: "Package B",
      available: hasStandardTickets(),
    },
    {
      id: "C",
      name: "Package C",
      available: hasStandardTickets(),
    },
  ];

  const fetchReservedSeats = async () => {
    try {
      setLoading(true);
      const reserved = await getReservedSeats();
      setReservedSeats(reserved);
    } catch (error) {
      console.error("Error fetching reserved seats: ", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch reserved seats. Please refresh the page.",
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservedSeats();

    const storedData = sessionStorage.getItem("ticketData");
    if (storedData) {
      const data = JSON.parse(storedData);
      const seats = data.selectedSeats || [];
      const packages = data.selectedPackages || [];

      setSelectedSeats(seats);
      setSelectedPackages(packages);

      // Recalculate price based on current early bird status
      const currentEarlyBirdStatus = checkEarlyBirdStatus();
      setIsEarlyBird(currentEarlyBirdStatus);
      const recalculatedPrice = recalculatePrice(seats, currentEarlyBirdStatus);
      setTotalPrice(recalculatedPrice);
    }
  }, []);

  useEffect(() => {}, [selectedSeats]);

  // Helper function to get seat number from seat code
  const getSeatNumber = (seatCode: string) => {
    const parts = seatCode.split("-");
    return parseInt(parts[1]);
  };

  // Helper function to determine if seat number should be hidden
  const shouldHideSeatNumber = (row: number, seatNum: number) => {
    // Hide all seat numbers in row 1
    if (row === 1) return true;

    // Hide seat numbers 1, 2, 3 in rows 12 and 13
    if ((row === 12 || row === 13) && seatNum >= 1 && seatNum <= 3) return true;

    return false;
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

      // Add reserved seats in this row (including Row 1 VIP seats)
      reservedSeats.forEach((seat) => {
        if (getRowNumber(seat) === targetRow) {
          occupiedSeats.add(getSeatNumber(seat));
        }
      });

      // Mark all Row 1 seats as occupied
      if (targetRow === 1) {
        for (let seat = 1; seat <= rowSeatCount; seat++) {
          occupiedSeats.add(seat);
        }
      }

      // Add disabled seats (rows 12 and 13, seats 1-3)
      if (targetRow === 12 || targetRow === 13) {
        for (let seat = 1; seat <= 3; seat++) {
          occupiedSeats.add(seat);
        }
      }

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
    if (isSelected) {
      updatedSeats = selectedSeats.filter((s) => s !== seatCode);
    } else {
      updatedSeats = [...selectedSeats, seatCode];
    }

    // Calculate new total price with bundle pricing
    const updatedPrice = recalculatePrice(updatedSeats, isEarlyBird);

    setSelectedSeats(updatedSeats);
    setTotalPrice(updatedPrice);

    const ticketData = {
      selectedSeats: updatedSeats,
      totalPrice: updatedPrice,
      selectedPackages,
    };
    sessionStorage.setItem("ticketData", JSON.stringify(ticketData));
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    setTimeout(scrollToTop, 100);
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

  const formatSeatList = (seats: string[]) => {
    return seats.map((seat, index) => (
      <span key={seat}>
        {seat}
        {index < seats.length - 1 ? ", " : ""} &nbsp;
      </span>
    ));
  };

  const renderSeats = () => {
    const seatRows: React.ReactElement[] = [];

    const generateSeatRow = (row: number, isLastRow: boolean) => {
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
        const isReserved =
          reservedSeats.includes(seatCode) || row === 1 || isLastRow; // Mark row 1 as reserved (VIP)
        const isDisabled =
          (row === 12 || row === 13) && seatNum >= 1 && seatNum <= 3;

        const seatColor =
          zone && zones[zone as keyof typeof zones]
            ? zones[zone as keyof typeof zones].color
            : "normal";

        // Determine if seat number should be displayed
        const hideSeatNumber = shouldHideSeatNumber(row, seatNum) || isLastRow;

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
            {!hideSeatNumber && seatNum}
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

    generateSeatRow(1, false); // VIP row - now reserved
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

            {/* Legend with KEY header */}
            <div className="legend">
              <div className="legend-header">
                <strong>KEY</strong>
              </div>
              <div>
                <span
                  className="seat deluxe"
                  style={{ marginRight: "8px" }}
                ></span>{" "}
                Deluxe &nbsp; [RM
                {seatPrices["Deluxe"].original}]
              </div>
              <div>
                <span
                  className="seat normal"
                  style={{ marginRight: "8px" }}
                ></span>{" "}
                Standard &nbsp; [RM
                {seatPrices["Standard1"].original}]
              </div>
              <div>
                <span
                  className="seat selected"
                  style={{ marginRight: "8px" }}
                ></span>{" "}
                Selected
              </div>
              <div>
                <span
                  className="seat reserved"
                  style={{ marginRight: "8px" }}
                ></span>{" "}
                Sold
              </div>
            </div>

            {/* Scroll hint moved here */}
            <span className="swipe-hint">
              <DoubleRightOutlined />
              &nbsp; Scroll left to view more seats
            </span>

            <div className="stage">STAGE</div>

            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="seating-chart">{renderSeats()}</div>
            )}
          </div>

          <div className="right-section">
            <div className="seats-selected">
              <h5>Seats Selected</h5>

              {/* Conditional Early Bird Promo Display */}
              {isEarlyBird && (
                <div className="early-bird-promo">
                  <h6>Early Bird Promotion</h6>
                </div>
              )}

              {deluxeSeats.length > 0 && (
                <div className="ticket-type-display">
                  <div className="ticket-type-header ticket-row">
                    <span className="ticket-type-label">
                      Deluxe x {deluxeSeats.length}
                    </span>
                    <div className="selected-seats-display">
                      {formatSeatList(deluxeSeats)}
                    </div>
                  </div>

                  {/* Bundle pricing for sets of 6 */}
                  {Math.floor(deluxeSeats.length / 6) > 0 && (
                    <div className="price-display">
                      <span className="original-price">
                        RM{seatPrices.Deluxe.bundleOriginal}
                      </span>
                      <span className="current-price">
                        RM
                        {isEarlyBird
                          ? seatPrices.Deluxe.bundleEarlyBird
                          : seatPrices.Deluxe.bundleOriginal}
                      </span>
                      <span className="quantity">
                        x {Math.floor(deluxeSeats.length / 6) * 6}
                      </span>
                    </div>
                  )}

                  {/* Regular pricing for remainder */}
                  {deluxeSeats.length % 6 > 0 && (
                    <div className="price-display">
                      {isEarlyBird && (
                        <span className="original-price">
                          RM{seatPrices.Deluxe.original}
                        </span>
                      )}
                      <span className="current-price">
                        RM
                        {isEarlyBird
                          ? seatPrices.Deluxe.earlyBird
                          : seatPrices.Deluxe.original}
                      </span>
                      <span className="quantity">
                        x {deluxeSeats.length % 6}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {normalSeats.length > 0 && (
                <div className="ticket-type-display">
                  <div className="ticket-type-header ticket-row">
                    <span className="ticket-type-label">
                      Standard x {normalSeats.length}
                    </span>
                    <div className="selected-seats-display">
                      {formatSeatList(normalSeats)}
                    </div>
                  </div>

                  {/* Bundle pricing for sets of 6 */}
                  {Math.floor(normalSeats.length / 6) > 0 && (
                    <div className="price-display">
                      <span className="original-price">
                        RM{seatPrices.Standard1.bundleOriginal}
                      </span>
                      <span className="current-price">
                        RM
                        {isEarlyBird
                          ? seatPrices.Standard1.bundleEarlyBird
                          : seatPrices.Standard1.bundleOriginal}
                      </span>
                      <span className="quantity">
                        x {Math.floor(normalSeats.length / 6) * 6}
                      </span>
                    </div>
                  )}

                  {/* Regular pricing for remainder */}
                  {normalSeats.length % 6 > 0 && (
                    <div className="price-display">
                      {isEarlyBird && (
                        <span className="original-price">
                          RM{seatPrices.Standard1.original}
                        </span>
                      )}
                      <span className="current-price">
                        RM
                        {isEarlyBird
                          ? seatPrices.Standard1.earlyBird
                          : seatPrices.Standard1.original}
                      </span>
                      <span className="quantity">
                        x {normalSeats.length % 6}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {deluxeSeats.length >= 6 && (
                <div className="bundle-type-display">
                  <div className="ticket-type-row">
                    <div className="ticket-left">
                      Deluxe Group Ticket Bundle
                    </div>
                    <div className="ticket-right">
                      x {Math.floor(deluxeSeats.length / 6)}
                    </div>
                  </div>
                  <div className="ticket-subtext">
                    {Math.floor(deluxeSeats.length / 6) * 6} tickets for RM{" "}
                    {Math.floor(deluxeSeats.length / 6) * 252}
                  </div>
                </div>
              )}

              {normalSeats.length >= 6 && (
                <div className="bundle-type-display">
                  <div className="ticket-type-row">
                    <div className="ticket-left">
                      Standard Group Ticket Bundle
                    </div>
                    <div className="ticket-right">
                      x {Math.floor(normalSeats.length / 6)}
                    </div>
                  </div>
                  <div className="ticket-subtext">
                    {Math.floor(normalSeats.length / 6) * 6} tickets for RM{" "}
                    {Math.floor(normalSeats.length / 6) * 132}
                  </div>
                </div>
              )}

              {selectedSeats.length === 0 && (
                <div className="selected-seats-display">
                  <p>No seats selected</p>
                </div>
              )}
            </div>

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
