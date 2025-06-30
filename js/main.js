// ---------------------------------------------
// Navbar scroll toggle (adds .scrolled class)
// ---------------------------------------------
window.addEventListener('scroll', function () {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// ---------------------------------------------
// Isotope Filter Initialization for Portfolio
// ---------------------------------------------
$(window).load(function(){
	var $container = $('.educationContainer');
	$container.isotope({
	  filter: '*',
	  animationOptions: {
		duration: 750,
		easing: 'linear',
		queue: false
	  }
	});
  
	$('.educationFilter a').click(function(){
	  $('.educationFilter .current').removeClass('current');
	  $(this).addClass('current');
  
	  var selector = $(this).attr('data-filter');
	  $container.isotope({
		filter: selector,
		animationOptions: {
		  duration: 750,
		  easing: 'linear',
		  queue: false
		}
	  });
	  return false;
	});
  });
  

// ---------------------------------------------
// Mobile menu toggle
// ---------------------------------------------
const menuToggle = document.getElementById('menuToggle');
const navbarDropdown = document.getElementById('navbarDropdown');

if (menuToggle && navbarDropdown) {
  menuToggle.addEventListener('click', () => {
    navbarDropdown.classList.toggle('open');
  });
}

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
  