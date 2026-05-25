document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");

  if (!form || !status) {
    return;
  }

  const submitButton = form.querySelector('button[type="submit"]');
  const statusClasses = ["is-error", "is-success"];
  const endpoint = form.dataset.formEndpoint?.trim();

  function setStatus(message, type) {
    status.textContent = message;
    status.classList.remove(...statusClasses);

    if (type) {
      status.classList.add(type);
    }
  }

  function setBusyState(isBusy) {
    form.setAttribute("aria-busy", String(isBusy));

    if (submitButton) {
      submitButton.disabled = isBusy;
    }
  }

  if (!endpoint) {
    setStatus("Contact form is not configured right now.", "is-error");
    setBusyState(true);
    return;
  }

  form.addEventListener("reset", () => {
    setStatus("");
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    setBusyState(true);
    setStatus("Sending your message...");

    const formData = new FormData(form);
    const data = {
      name: formData.get("name")?.toString().trim() ?? "",
      email: formData.get("email")?.toString().trim() ?? "",
      subject: formData.get("subject")?.toString().trim() ?? "",
      message: formData.get("message")?.toString().trim() ?? "",
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      form.reset();
      setStatus("Message sent successfully.", "is-success");
    } catch (error) {
      setStatus("Unable to send your message right now. Please try again.", "is-error");
    } finally {
      setBusyState(false);
    }
  });
});
