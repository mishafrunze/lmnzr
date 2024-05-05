const LmnzrCore = function () {

    let windowWidth;
    let windowHeight;

    const _getViewport = function ()
    {

        return {
            vw: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
            vh: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
        }

    }

    const _setWindowHeight = function (varsSuffix = ['', '-live']) {

        let viewport    = _getViewport();

        windowWidth     = viewport.vw;
        windowHeight    = viewport.vh;

        if ('CSS' in window && CSS.supports('color', 'var(--color-var)'))
        {
            varsSuffix.forEach(suffix => document.body.style.setProperty(`--window-height${suffix}`, `${viewport.vh}px`));
        }
        else
        {
            document.documentElement.classList.add('no-css-properties-support');
        }

    }


    const isTouch = function () {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
    }


    const init = function () {

        window.addEventListener('DOMContentLoaded', () => {

            if (isTouch())
            {
                document.documentElement.classList.add('is-touch');
                document.documentElement.setAttribute('data-is-touch', '1');
            }
            else
            {
                document.querySelectorAll('.is-touch').forEach((el) => el.classList.remove('is-touch'));
            }

            _setWindowHeight();

            let screenOrientation = window.screen.orientation.type;

            window.addEventListener('resize', (event) => {
                const varsSuffix = (screenOrientation !== event.target.screen.orientation.type) ? ['', '-live'] : ['-live'];
                _setWindowHeight(varsSuffix);
                screenOrientation = event.target.screen.orientation.type;
            });

        });

    }

    return {
        isTouch,
        init
    }

}();