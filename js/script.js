document.addEventListener('DOMContentLoaded', () => {
    // Custom Smooth Cursor
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;

    // Lerp tracking for smooth cursor
    const lerp = (start, end, factor) => start + (end - start) * factor;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const renderCursor = () => {
        cursorX = lerp(cursorX, mouseX, 0.15); // Smooth factor
        cursorY = lerp(cursorY, mouseY, 0.15);
        cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%)`;
        requestAnimationFrame(renderCursor);
    };
    requestAnimationFrame(renderCursor);

    const hoverElements = document.querySelectorAll('a, button, .portfolio-item, .service-card, .branch-card, .gallery-trigger');
    hoverElements.forEach(el => {
        el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
        el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
    });

    // Mobile Navigation Toggle
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('.nav-links');

    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            navToggle.innerHTML = navLinks.classList.contains('active')
                ? '<i class="fas fa-times"></i>'
                : '<i class="fas fa-bars"></i>';
        });
    }

    // Scroll Animations (Intersection Observer)
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show-scroll');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const hiddenElements = document.querySelectorAll('.hidden-scroll');
    hiddenElements.forEach(el => observer.observe(el));

    // Navbar background & Parallax on scroll
    const navbar = document.querySelector('.navbar');
    const parallaxElements = document.querySelectorAll('.parallax');

    window.addEventListener('scroll', () => {
        // Navbar check
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(255, 255, 255, 0.95)';
            navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.05)';
            navbar.style.backdropFilter = 'blur(20px)';
        } else {
            navbar.style.background = 'rgba(255, 255, 255, 0.8)';
            navbar.style.boxShadow = 'none';
        }

        // Parallax updates
        const scrolled = window.scrollY;
        parallaxElements.forEach(el => {
            const speed = el.getAttribute('data-speed') || 0.5;
            el.style.transform = `translateY(${scrolled * speed}px)`;
        });
    });

    // Portfolio Filtering
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioItems = document.querySelectorAll('.portfolio-item');

    if (filterBtns.length > 0 && portfolioItems.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                portfolioItems.forEach(item => {
                    item.style.transition = 'all 0.3s ease';
                    if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                        item.style.display = 'flex'; // It's a flex column
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'scale(1)';
                        }, 10);
                    } else {
                        item.style.opacity = '0';
                        item.style.transform = 'scale(0.8)';
                        setTimeout(() => {
                            item.style.display = 'none';
                        }, 300);
                    }
                });
            });
        });
    }

    // Interactive Gallery Modal
    const modal = document.getElementById('gallery-modal');
    if (modal) {
        const modalContent = document.getElementById('gallery-content');
        const closeBtn = document.querySelector('.gallery-close');

        document.querySelectorAll('.gallery-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const src = trigger.getAttribute('data-src');
                const type = trigger.getAttribute('data-type');

                modalContent.innerHTML = '';

                if (type === 'image') {
                    const img = document.createElement('img');
                    img.src = src;
                    modalContent.appendChild(img);
                } else if (type === 'video') {
                    const video = document.createElement('video');
                    video.src = src;
                    video.controls = true;
                    video.autoplay = true;
                    modalContent.appendChild(video);
                }

                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });

        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            modalContent.innerHTML = '';
            document.body.style.overflow = 'auto';
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                modalContent.innerHTML = '';
                document.body.style.overflow = 'auto';
            }
        });
    }    // Add Page Transitions
    // Initial opacity 0 is now handled by CSS to prevent FOUC
    // Delay slightly to ensure smooth fade in on load
    requestAnimationFrame(() => {
        document.body.style.opacity = '1';
    });

    // Fade out on navigation
    const links = document.querySelectorAll('a[href]:not([target="_blank"]):not([href^="#"]):not([href^="mailto:"])');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            let destination = link.href;

            // Fix local testing for folder links
            if (window.location.protocol === 'file:' && destination.endsWith('/')) {
                destination += 'index.html';
            }

            // Only fade out for internal links
            if (destination && (destination.includes(window.location.host) || window.location.protocol === 'file:')) {
                e.preventDefault();
                document.body.style.opacity = '0';
                setTimeout(() => {
                    window.location.href = destination;
                }, 400); // matches the transition time
            }
        });
    });

});

// Fix for Back-Forward Cache (bfcache) blank page issue
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        document.body.style.opacity = '1';
    }
});
