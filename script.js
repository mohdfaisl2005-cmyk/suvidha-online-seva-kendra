document.addEventListener("DOMContentLoaded", function () {

  const form = document.querySelector("form");

  form.addEventListener("submit", function (e) {

    e.preventDefault();

    const name = document.querySelector('input[type="text"]').value;
    const mobile = document.querySelector('input[type="tel"]').value;
    const email = document.querySelector('input[type="email"]').value;
    const enquiry = document.querySelector("textarea").value;

    const message =
`*New Enquiry*

👤 Name: ${name}

📱 Mobile: ${mobile}

📧 Email: ${email}

📝 Enquiry:
${enquiry}`;

    const url =
`https://wa.me/918004376439?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank");

  });

});