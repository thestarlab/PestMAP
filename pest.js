// Photo enlargement uses the browser's modal dialog for focus and Escape handling.
const pestPhotoDialog = document.getElementById('pestPhotoDialog');
document.getElementById('pestImageGallery').addEventListener('click', function (event) {
	const button = event.target.closest('.pest-photo-button');
	if (!button) return;
	const photo = button.querySelector('img');
	const enlarged = document.getElementById('pestPhotoLarge');
	enlarged.src = photo.src;
	enlarged.alt = photo.alt;
	document.getElementById('pestPhotoCaption').textContent = photo.alt;
	document.getElementById('pestPhotoCredit').textContent = document.getElementById('pestImageCredit').textContent;
	pestPhotoDialog.showModal();
});
pestPhotoDialog.addEventListener('click', function (event) {
	if (event.target !== pestPhotoDialog) return;
	const bounds = pestPhotoDialog.getBoundingClientRect();
	if (event.clientX < bounds.left || event.clientX > bounds.right ||
		event.clientY < bounds.top || event.clientY > bounds.bottom) pestPhotoDialog.close();
});

// Fade only when the displayed species actually changes.
const profile = document.querySelector('.pest-profile');
const profileName = document.getElementById('pestName');
const profileMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let displayedSpecies = profileName.textContent;
let profileAnimation;
new MutationObserver(function () {
	if (displayedSpecies === profileName.textContent) return;
	displayedSpecies = profileName.textContent;
	if (profileAnimation) profileAnimation.cancel();
	if (!profileMotion.matches && typeof profile.animate === 'function') {
		profileAnimation = profile.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
	}
}).observe(profileName, { childList: true, characterData: true, subtree: true });
profileMotion.addEventListener('change', function (event) {
	if (event.matches && profileAnimation) profileAnimation.cancel();
});
