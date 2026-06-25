const GOOGLE_CALENDAR_URL = "https://script.google.com/macros/s/AKfycbw-HCKRNdo1m1F0DK-B4-uzzGphONWYJaA5uJs_WkPmgrKO-0seW2jxba5oV25QRB1x/exec";
let seletedDateAvailable = null;

function rentItem(itemName, price, deposit) {
    let selectedItem = {
        name: itemName,
        price: price,
        deposit: deposit
    };

    localStorage.setItem("selectedItem", JSON.stringify(selectedItem));
    window.location.href = "rent.html";
}

async function goToPayment() {

    let item = JSON.parse(localStorage.getItem("selectedItem"));

    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;
    let pickup = document.getElementById("pickup").value;
    if (selectedDateAvailable === false) {
    alert("Sorry, this item is not available for the selected date. Please choose another date.");
    return;
}

if (selectedDateAvailable === null) {
    alert("Please check item availability before continuing to payment.");
    return;
}

    let studentEmail =
        document.getElementById("studentEmail").value

    let studentCardFile =
        document.getElementById("studentCard").files[0];

    if (!studentCardFile) {
        alert("Please upload your student card.");
        return;
    }

    let base64 = await fileToBase64(studentCardFile);

    localStorage.setItem(
        "studentCardData",
        JSON.stringify({
            data: base64,
            name: studentCardFile.name,
            type: studentCardFile.type
        })
    );

    if (!startDate || !endDate) {
    alert("Please select rental start date and end date.");
    return;
    }
    let days =
        (new Date(endDate) - new Date(startDate)) /
        (1000 * 60 * 60 * 24) + 1;

    let total = (item.price * days) + item.deposit;

    let booking = {
        bookingID: "URH" + Date.now(),
        fullName: document.getElementById("fullName").value,
        studentId: document.getElementById("studentId").value,
        item: item.name,
        email: studentEmail,
        phone: document.getElementById("phone").value,
        startDate: startDate,
        endDate: endDate,
        days: days,
        pickup: pickup,
        total: total,
        status: "Pending Payment"
    };

    localStorage.setItem("currentBooking", JSON.stringify(booking));

    window.location.href = "payment.html";
}
function loadPaymentPage() {
    let booking = JSON.parse(localStorage.getItem("currentBooking"));
    let paymentSummary = document.getElementById("paymentSummary");

    if (!paymentSummary) return;

    if (!booking) {
        paymentSummary.innerHTML = "No booking found. Please rent an item first.";
        return;
    }

    paymentSummary.innerHTML = `
        <h2>Booking Summary</h2>
        <p><b>Booking ID:</b> ${booking.bookingID}</p>
        <p><b>Item:</b> ${booking.item}</p>
        <p><b>Rental Period:</b> ${booking.startDate} to ${booking.endDate}</p>
        <p><b>Rental Duration:</b> ${booking.days} Day(s)</p>
        <p><b>Pickup:</b> ${booking.pickup}</p>
        <p><b>Total Payment:</b> RM${booking.total}</p>
        <p><b>Status:</b> ${booking.status}</p>
    `;
}

function confirmPayment() {
    let paymentButton = document.getElementById("confirmBtn");
    let proof = document.getElementById("paymentProof");

    if (!proof.files.length) {
        alert("Please upload your payment proof before confirming payment.");
        return;
    }

    paymentButton.innerHTML = "⏳ Processing Payment...";
    paymentButton.disabled = true;

    let booking = JSON.parse(localStorage.getItem("currentBooking"));

    if (!booking) {
        alert("No booking found.");
        paymentButton.innerHTML = "Confirm Payment";
        paymentButton.disabled = false;
        return;
    }

    booking.status = "Active";
    booking.endTime = new Date(booking.endDate).getTime();

    localStorage.setItem("activeRental", JSON.stringify(booking));

    fetch(
        GOOGLE_CALENDAR_URL +
        "?action=book" +
        "&bookingID=" + encodeURIComponent(booking.bookingID) +
        "&fullName=" + encodeURIComponent(booking.fullName) +
        "&studentId=" + encodeURIComponent(booking.studentId) +
        "&item=" + encodeURIComponent(booking.item) +
        "&startDate=" + encodeURIComponent(booking.startDate) +
        "&endDate=" + encodeURIComponent(booking.endDate) +
        "&pickup=" + encodeURIComponent(booking.pickup) +
        "&total=" + encodeURIComponent(booking.total) +
        "&email=" + encodeURIComponent(booking.email) +
        "&phone=" + encodeURIComponent(booking.phone || "")
    )
    .then(response => response.text())
    .then(data => {
        alert("🎉 Your booking confirmation has been sent to your student email. Kindly check your SPAM folder if you don't see it in your inbox. Thank you for using UniRent Hub!")
        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 500);
    })
    .catch(error => {
        console.log("Booking error:", error);
        alert("Booking submitted, but there may be a connection issue. Please check your email.");

        paymentButton.innerHTML = "Confirm Payment";
        paymentButton.disabled = false;
    });
}
async function checkAvailability() {
    let item = JSON.parse(localStorage.getItem("selectedItem"));
    let startDate = document.getElementById("startDate").value;
    let endDate = document.getElementById("endDate").value;
    let box = document.getElementById("availabilityBox");

    if (!box) return;

    if (!startDate || !endDate) {
        selectuedDateAvailable = null;
        box.innerHTML = "Please select rental dates.";
        return;
    } 
    if (new Date(endDate) < new Date(startDate)) {
    selectedDateAvailable = false;
    box.innerHTML = "End date cannot be earlier than start date.";
    box.className = "availability-box not-available-date";
    return;
}

    box.innerHTML = "Checking Google Calendar availability...";

    let url =
        GOOGLE_CALENDAR_URL +
        "?action=check" +
        "&item=" + encodeURIComponent(item.name) +
        "&startDate=" + encodeURIComponent(startDate) +
        "&endDate=" + encodeURIComponent(endDate);

    let response = await fetch(url);
    let data = await response.json();

   if (data.available) {
    selectedDateAvailable = true;
    box.innerHTML = "Good news! This item is available.";
    box.className = "availability-box available-date";
} else {
    selectedDateAvailable = false;
    box.innerHTML = "Sorry, this item is not available on the selected dates.";
    box.className = "availability-box not-available-date";
}
}
function showTerms() {
    document.getElementById("termsPopup").style.display = "block";
}

function closeTerms() {
    document.getElementById("termsPopup").style.display = "none";
}

loadPaymentPage();

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        let reader = new FileReader();

        reader.onload = function () {
            let base64 = reader.result.split(",")[1];
            resolve(base64);
        };

        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function findOrders() {
    let studentId = document.getElementById("searchStudentId").value.trim();
    let orderResults = document.getElementById("orderResults");

    if (!studentId) {
        orderResults.innerHTML = "Please enter your Student ID.";
        return;
    }

    orderResults.innerHTML = "Searching your orders...";

    fetch(
        GOOGLE_CALENDAR_URL +
        "?action=orders" +
        "&studentId=" + encodeURIComponent(studentId)
    )
    .then(response => response.json())
    .then(orders => {
        if (orders.length === 0) {
            orderResults.innerHTML = "No orders found for this Student ID.";
            return;
        }

        orderResults.innerHTML = orders.map(order => `
            <div class="selected-item" style="margin-bottom:15px;">
                <p><b>Booking ID:</b> ${order.bookingID}</p>
                <p><b>Name:</b> ${order.fullName}</p>
                <p><b>Item:</b> ${order.item}</p>
                <p><b>Rental Period:</b> ${formatDate(order.startDate)} to ${formatDate(order.endDate)}</p>
                <p><b>Pickup Location:</b> ${order.pickup}</p>
                <p><b>Total Payment:</b> RM${order.total}</p>
                <p><b>Status:</b> ${order.status}</p>
            </div>
        `).join("");
    })
    .catch(error => {
        orderResults.innerHTML = "Unable to load orders. Please try again.";
        console.log(error);
    });
}

function formatDate(dateValue) {
    let date = new Date(dateValue);

    if (isNaN(date)) {
        return dateValue;
    }

    return date.toLocaleDateString("en-GB");
}

function allowTodayBooking() {
    let today = new Date();
    let yyyy = today.getFullYear();
    let mm = String(today.getMonth() + 1).padStart(2, "0");
    let dd = String(today.getDate()).padStart(2, "0");

    let todayString = yyyy + "-" + mm + "-" + dd;

    let startDate = document.getElementById("startDate");
    let endDate = document.getElementById("endDate");

    if (startDate) startDate.min = todayString;
    if (endDate) endDate.min = todayString;
}

document.addEventListener("DOMContentLoaded", allowTodayBooking);

function submitSupplierInquiry() {
    let name = document.getElementById("supplierName").value;
    let studentId = document.getElementById("supplierStudentId").value;
    let email = document.getElementById("supplierEmail").value;
    let phone = document.getElementById("supplierPhone").value;
    let item = document.getElementById("supplierItem").value;
    let message = document.getElementById("supplierMessage").value;

    fetch(
        GOOGLE_CALENDAR_URL +
        "?action=supplierInquiry" +
        "&name=" + encodeURIComponent(name) +
        "&studentId=" + encodeURIComponent(studentId) +
        "&email=" + encodeURIComponent(email) +
        "&phone=" + encodeURIComponent(phone) +
        "&item=" + encodeURIComponent(item) +
        "&message=" + encodeURIComponent(message)
    )
    .then(response => response.text())
    .then(data => {
        alert(
            "🎉 Your supplier inquiry has been submitted successfully!\n\n" +
            "Thank you for your interest in becoming a supplier on UniRent Hub.\n" +
            "Our team will review your inquiry and contact you soon."
        );

        document.querySelector("form").reset();
    })
    .catch(error => {
        console.log("Supplier inquiry error:", error);
    });
}

