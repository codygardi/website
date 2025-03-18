let numberElement = document.getElementById("number");
let currentNumber = 222;
let speed = 1000; // Speed in milliseconds

function cycleNumbers() {
  currentNumber = (currentNumber + 1) % 10000; // Reset after 9999
  numberElement.textContent = currentNumber;
  setTimeout(cycleNumbers, speed);
}

cycleNumbers(); // Start the loop