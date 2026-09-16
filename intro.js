// Reveal Introduction groups once inside their own scrolling panel.
// Content remains visible if animation or intersection observation is unavailable.
const introScrollPanel = document.getElementById('introTab');
const scrollMotionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
if (introScrollPanel && 'IntersectionObserver' in window && !scrollMotionPreference.matches) {
	const scrollAnimations = new Set();
	const scrollRevealObserver = new IntersectionObserver(function (entries) {
		entries.forEach(function (entry) {
			if (!entry.isIntersecting) return;
			scrollRevealObserver.unobserve(entry.target);
			if (scrollMotionPreference.matches || entry.target.contains(document.activeElement)) return;
			if (typeof entry.target.animate !== 'function') return;
			const animation = entry.target.animate([
				{ opacity: 0, transform: 'translateY(12px)' },
				{ opacity: 1, transform: 'translateY(0)' }
			], { duration: 480, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' });
			scrollAnimations.add(animation);
			animation.onfinish = animation.oncancel = function () { scrollAnimations.delete(animation); };
		});
	}, { root: introScrollPanel, threshold: 0 });
	introScrollPanel.querySelectorAll('[data-scroll-reveal]').forEach(function (section) {
		scrollRevealObserver.observe(section);
		section.addEventListener('focusin', function () {
			scrollRevealObserver.unobserve(section);
			section.getAnimations().forEach(function (animation) { animation.cancel(); });
		});
	});
	scrollMotionPreference.addEventListener('change', function (event) {
		if (event.matches) {
			scrollRevealObserver.disconnect();
			scrollAnimations.forEach(function (animation) { animation.cancel(); });
		}
	});
}

// Follow the actual active tab, including navigation from Introduction cards.
const tabBar = document.querySelector('.tab-bar');
if (tabBar) {
	const indicator = document.createElement('span');
	indicator.className = 'tab-indicator';
	indicator.setAttribute('aria-hidden', 'true');
	tabBar.appendChild(indicator);
	function positionTabIndicator() {
		const activeTab = tabBar.querySelector('.tab-button.active');
		if (!activeTab) return;
		indicator.style.width = activeTab.offsetWidth + 'px';
		indicator.style.transform = 'translateX(' + activeTab.offsetLeft + 'px)';
	}
	positionTabIndicator();
	tabBar.classList.add('has-tab-indicator');
	requestAnimationFrame(function () {
		requestAnimationFrame(function () { indicator.classList.add('is-ready'); });
	});
	const tabObserver = new MutationObserver(positionTabIndicator);
	tabBar.querySelectorAll('.tab-button').forEach(function (button) {
		tabObserver.observe(button, { attributes: true, attributeFilter: ['class'] });
	});
	if (typeof ResizeObserver !== 'undefined') {
		const tabResizeObserver = new ResizeObserver(positionTabIndicator);
		tabResizeObserver.observe(tabBar);
		tabBar.querySelectorAll('.tab-button').forEach(function (button) {
			tabResizeObserver.observe(button);
		});
	} else {
		window.addEventListener('resize', positionTabIndicator);
	}
}

// Introduction links reuse the application's existing tab navigation.
document.querySelectorAll('[data-intro-tab]').forEach(function (button) {
	button.addEventListener('click', function () {
		const tab = document.querySelector('.tab-button[data-tab="' + button.dataset.introTab + '"]');
		if (tab) {
			tab.click();
			tab.focus();
		}
	});
});

// Reveal the banner once; returning to Introduction keeps it still.
const introHero = document.querySelector('.intro-hero');
if (introHero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
	introHero.classList.add('intro-enter');
	introHero.addEventListener('animationend', function (event) {
		if (event.target === introHero) introHero.classList.remove('intro-enter');
	});

	// Draw each contour once, with a small stagger after the banner appears.
	// The underlying SVG stays visible when animations finish or are cancelled.
	const contourAnimations = [];
	introHero.querySelectorAll('.intro-contours path').forEach(function (path, index) {
		if (typeof path.animate !== 'function') return;
		const length = path.getTotalLength();
		contourAnimations.push(path.animate([
			{ strokeDasharray: String(length), strokeDashoffset: String(length) },
			{ strokeDasharray: String(length), strokeDashoffset: '0' }
		], {
			duration: 1800,
			delay: 300 + index * 120,
			easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
			fill: 'backwards'
		}));
	});

	const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
	motionPreference.addEventListener('change', function (event) {
		if (event.matches) {
			contourAnimations.forEach(function (animation) { animation.cancel(); });
			introHero.classList.remove('intro-enter');
		}
	});
}
