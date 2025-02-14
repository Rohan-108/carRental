import ChatService from "../../js/services/ChatService.js";
import carService from "../../js/services/carService.js";
import BidService from "../../js/services/BidService.js";
import { getCurrentCarId, getCurrentUser, toast } from "../../js/index.js";
import { loadUserChat } from "./carChat.js";
import userService from "../../js/services/userService.js";
import { getDaysDiff } from "../../js/utils.js";
const amountInput = document.getElementById("amount");
const minRentalPeriod = document.getElementById("minRentalPeriod");
const maxRentalPeriod = document.getElementById("maxRentalPeriod");
// Get booked dates for the car
async function getBookedDates() {
  const carId = getCurrentCarId();
  if (!carId) return [];

  try {
    const bookings = await BidService.getBookingsByCarId(carId);
    return bookings.flatMap((booking) =>
      getDatesInRange(booking.startDate, booking.endDate)
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    toast("error", "Error fetching bookings").showToast();
    return [];
  }
}
// Get dates in the range of start and end date
let picker;
async function setupDatePicker() {
  const carId = getCurrentCarId();
  const bookedDates = await getBookedDates();
  const car = await carService.getCarById(carId);
  minRentalPeriod.textContent = car.minRentalPeriod;
  maxRentalPeriod.textContent = car.maxRentalPeriod;
  amountInput.value = car.rentalPrice;
  amountInput.setAttribute("min", car.rentalPrice);
  const formattedBookedDates = bookedDates.map(
    (d) => new easepick.DateTime(d, "YYYY-MM-DD")
  );

  picker = new easepick.create({
    element: document.getElementById("datepicker"),
    css: ["https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.css"],
    plugins: ["RangePlugin", "LockPlugin"],
    zIndex: 1000,
    RangePlugin: {
      tooltipNumber(num) {
        return num;
      },
      locale: {
        one: "day",
        other: "days",
      },
    },
    LockPlugin: {
      minDate: new Date(),
      minDays: car.minRentalPeriod,
      inseparable: true,
      filter(date, picked) {
        if (picked.length === 1) {
          return (
            !picked[0].isSame(date, "day") &&
            date.inArray(formattedBookedDates, "[]")
          );
        }
        return date.inArray(formattedBookedDates, "[]");
      },
    },
  });
}

setupDatePicker();

// Rent button click event

document.getElementById("rentButton").addEventListener("click", async () => {
  try {
    const u = getCurrentUser();
    const carId = getCurrentCarId();
    const car = await carService.getCarById(carId);
    const user = await userService.getUserById(u.id);
    // Retrieve selected dates
    if (user.id === car.userId) {
      toast("error", "You cannot rent your own car").showToast();
      return;
    }
    if (user.role === "super-admin") {
      toast("error", "Super Admin cannot rent a car").showToast();
      return;
    }
    const startDate = picker.getStartDate()?.format("YYYY-MM-DD");
    const endDate = picker.getEndDate()?.format("YYYY-MM-DD");
    if (!startDate || !endDate) {
      toast("error", "Please select a date range").showToast();
      return;
    }
    const nOfdays = getDaysDiff(startDate, endDate);
    if (
      nOfdays < Number(car.minRentalPeriod) ||
      nOfdays > Number(car.maxRentalPeriod)
    ) {
      toast("error", "Rent period is out of range").showToast();
      return;
    }
    if (amountInput.value < Number(car.rentalPrice)) {
      toast(
        "error",
        "Amount should be greater than or equal to base rental price"
      ).showToast();
      return;
    }
    await BidService.addBid({
      id: "",
      carId,
      startDate,
      endDate,
      userId: user.id,
      amount: amountInput.value,
      ownerId: car.ownerId,
      car: car,
      user: user,
      status: "pending",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const bidNow = document.getElementById("rentButton");
    let convId = bidNow.dataset.conversationId;
    if (!convId) {
      const id = await ChatService.addConversation({
        id: "",
        carId: carId,
        car: car,
        members: [user, car.owner],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      convId = id;
    }
    await ChatService.addChat({
      id: "",
      conversationId: convId,
      message: `I am interested in renting your car, I have placed a bid of Rs.${amountInput.value} for ${nOfdays} days from ${startDate} to ${endDate}.
      Please accept my bid if you are interested.`,
      image: null,
      sender: user.id,
      user: user,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    picker.clear();
    toast("success", "Bid Placed Successfully").showToast();
    loadUserChat();
  } catch (error) {
    console.error("Error renting car:", error);
    toast("error", "Error renting car").showToast();
  }
});

// Get dates in the range of start and end date

function getDatesInRange(startDate, endDate) {
  const dates = [];
  let currentDate = new Date(startDate);
  const end = new Date(endDate);

  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
