// contact-form.js — client-side validation + success state for the Contact
// lead form. Submission is intercepted (preventDefault) until a real endpoint
// is wired; replace the success path with a fetch() to your backend.
(function () {
	"use strict";
	var form = document.getElementById("lead-form");
	if (!form) return;
	var successEl = document.getElementById("form-success");

	// Validators per field id
	var rules = {
		"f-name": function (v) {
			return v.trim().length > 1;
		},
		"f-email": function (v) {
			return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
		},
		"f-org": function (v) {
			return v.trim().length > 1;
		},
		"f-type": function (v) {
			return v !== "";
		},
		"f-help": function (v) {
			return v !== "";
		},
		"f-message": function (v) {
			return v.trim().length > 4;
		},
	};

	function fieldWrap(el) {
		return el.closest(".field");
	}

	function validateField(el) {
		var rule = rules[el.id];
		if (!rule) return true;
		var ok = rule(el.value);
		var wrap = fieldWrap(el);
		if (wrap) wrap.classList.toggle("invalid", !ok);
		el.setAttribute("aria-invalid", ok ? "false" : "true");
		return ok;
	}

	// Format optional phone as (XXX) XXX-XXXX
	var phoneEl = document.getElementById("f-phone");
	if (phoneEl) {
		phoneEl.addEventListener("input", function () {
			var digits = phoneEl.value.replace(/\D/g, "").slice(0, 10);
			if (!digits.length) {
				phoneEl.value = "";
				return;
			}
			if (digits.length < 4) {
				phoneEl.value = "(" + digits;
			} else if (digits.length < 7) {
				phoneEl.value = "(" + digits.slice(0, 3) + ") " + digits.slice(3);
			} else {
				phoneEl.value = "(" + digits.slice(0, 3) + ") " + digits.slice(3, 6) + "-" + digits.slice(6);
			}
		});
	}

	// Live re-validation once a field has been touched/erroring
	Object.keys(rules).forEach(function (id) {
		var el = document.getElementById(id);
		if (!el) return;
		el.addEventListener("blur", function () {
			if (fieldWrap(el).classList.contains("invalid")) validateField(el);
		});
		el.addEventListener("input", function () {
			if (fieldWrap(el).classList.contains("invalid")) validateField(el);
		});
		el.addEventListener("change", function () {
			if (fieldWrap(el).classList.contains("invalid")) validateField(el);
		});
	});

	form.addEventListener("submit", function (e) {
		e.preventDefault(); // keep until a real endpoint is wired (see comment above)

		var firstInvalid = null;
		Object.keys(rules).forEach(function (id) {
			var el = document.getElementById(id);
			if (!el) return;
			var ok = validateField(el);
			if (!ok && !firstInvalid) firstInvalid = el;
		});

		if (firstInvalid) {
			firstInvalid.focus();
			return;
		}

		// --- Success path (replace with fetch() to your endpoint) ---
		form.classList.add("is-hidden");
		successEl.classList.add("is-shown");
		// Move focus to the success message for screen-reader + keyboard users
		successEl.focus();
	});
})();
