// ---------------------------------------------
// Contact Form Handling
// ---------------------------------------------
document.addEventListener("DOMContentLoaded", function () {
	const form = document.getElementById("contact-form");
	const status = document.getElementById("form-status");
  
	form.addEventListener("submit", function (e) {
	  e.preventDefault();
  
	  const data = {
		name: form.name.value,
		email: form.email.value,
		subject: form.subject.value,
		message: form.message.value,
	  };
  
	  fetch("https://formspree.io/f/xrbqedpp", {
		method: "POST",
		headers: {
		  "Content-Type": "application/json"
		},
		body: JSON.stringify(data),
	  })
		.then(response => {
		  if (response.ok) {
			status.innerText = "✅ Message sent successfully!";
			form.reset();
		  } else {
			status.innerText = "❌ Failed to send. Please try again.";
		  }
		})
		.catch(() => {
		  status.innerText = "⚠️ There was a problem sending your message.";
		});
	});
  });
  