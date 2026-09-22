/* Phone controls reuse the existing inputs and their map event handlers. */
(function () {
	"use strict";
	const phone = window.matchMedia("(max-width: 760px), (max-height: 500px) and (max-width: 960px)");
	const summary = document.getElementById("summaryDiv");
	const summaryContent = document.getElementById("summaryContent");
	const chartWrap = document.getElementById("chartWrap");
	const summaryBody = document.createElement("div");
	summaryBody.id = "mobileSummaryBody";
	summary.appendChild(summaryBody);
	summaryBody.append(summaryContent, chartWrap);
	const summaryButton = document.createElement("button");
	summaryButton.type = "button";
	summaryButton.className = "mobile-control summary-toggle";
	summaryButton.textContent = "Region statistics";
	summaryButton.setAttribute("aria-controls", summaryBody.id);
	summaryButton.setAttribute("aria-expanded", "false");
	summary.prepend(summaryButton);
	const preview = document.createElement("div");
	preview.className = "mobile-summary-preview";
	preview.textContent = "Tap a region on the map for statistics.";
	summaryButton.after(preview);
	summaryButton.addEventListener("click", function () {
		const expanded = summary.classList.toggle("mobile-expanded");
		summaryButton.setAttribute("aria-expanded", String(expanded));
	});
	new MutationObserver(function () {
		const title = summaryContent.querySelector(".panelTitle");
		const metrics = Array.from(summaryContent.querySelectorAll(".metricBox"));
		preview.textContent = title
			? title.textContent + " Â· " + metrics.map(function (box) { return box.textContent.trim().replace(/\s+/g, " "); }).join(" Â· ")
			: summaryContent.textContent.trim();
	}).observe(summaryContent, { childList: true, subtree: true, characterData: true });

	document.querySelectorAll(".map-panel").forEach(function (panel) {
		const sidebar = panel.querySelector(".selection-sidebar");
		sidebar.id = panel.id + "Filters";
		const legend = panel.querySelector(".legend-panel, .animation-legend-panel");
		const toolbar = document.createElement("div");
		toolbar.className = "mobile-map-toolbar";
		panel.querySelector(".map-selection-heading").appendChild(toolbar);
		function toggleButton(label, target, className) {
			const button = document.createElement("button");
			button.type = "button";
			button.className = "mobile-control";
			button.textContent = label;
			button.setAttribute("aria-controls", target.id);
			button.setAttribute("aria-expanded", "false");
			button.addEventListener("click", function () {
				const open = !panel.classList.contains(className);
				closePanels();
				panel.classList.toggle(className, open);
				button.setAttribute("aria-expanded", String(open));
			});
			toolbar.appendChild(button);
			return button;
		}
		function closePanels() {
			panel.classList.remove("mobile-filters-open", "mobile-legend-open");
			toolbar.querySelectorAll("button").forEach(function (button) { button.setAttribute("aria-expanded", "false"); });
		}
		toggleButton("Filters", sidebar, "mobile-filters-open");
		toggleButton("Legend", legend, "mobile-legend-open");
		const done = document.createElement("button");
		done.type = "button";
		done.className = "mobile-control mobile-filter-done";
		done.textContent = "Done";
		done.addEventListener("click", function () { closePanels(); toolbar.firstElementChild.focus(); });
		sidebar.appendChild(done);
		panel.addEventListener("keydown", function (event) {
			if (event.key === "Escape") { closePanels(); toolbar.firstElementChild.focus(); }
		});
		phone.addEventListener("change", closePanels);
	});

	const timeline = document.querySelector(".dynamics-timeline");
	const marker = document.createComment("Desktop timeline position");
	timeline.before(marker);
	const dock = document.createElement("div");
	dock.className = "mobile-playback-dock";
	document.getElementById("animationTab").appendChild(dock);
	const speed = document.getElementById("animationSpeedSelect");
	const speedLabel = document.querySelector('label[for="animationSpeedSelect"]');
	const speedMarker = document.createComment("Desktop speed position");
	speedLabel.before(speedMarker);
	const speedGroup = document.createElement("fieldset");
	speedGroup.className = "map-control-group mobile-speed-group";
	speedGroup.innerHTML = "<legend>Playback speed</legend>";
	document.querySelector("#animationTab .selection-sidebar").insertBefore(speedGroup, document.querySelector("#animationTab .mobile-filter-done"));
	function updateLayout() {
		if (phone.matches) {
			dock.appendChild(timeline);
			speedGroup.append(speedLabel, speed);
		} else {
			marker.after(timeline);
			speedMarker.after(speedLabel, speed);
		}
	}
	phone.addEventListener("change", updateLayout);
	updateLayout();
	function updateHeader() {
		document.body.classList.toggle("mobile-map-active", !!document.querySelector(".map-panel.active"));
	}
	new MutationObserver(updateHeader).observe(document.querySelector(".tab-layout"), { attributes: true, attributeFilter: ["class"], subtree: true });
	updateHeader();
})();
