const LmnzrLayoutHelpers = function () {

    const KEYS = {
        b: '',  /* Breakpoints */
        g: '',  /* Guides */
        o: '',  /* Outline */
    };

    const OPTIONS = {
        gridColumns: 12,
        gridFluid: false,
        gridColor: [255, 0, 128],
        gridOpacity: 1,
        breakpoints: {
            xs: 0,
            sm: 576,
            md: 768,
            lg: 992,
            xl: 1200,
            xxl: 1400
        },
        breakpointsMethod: 'expand'
    };


    const _showMessage = function (message, type = 'error') {
        if (type === 'error')
        {
            console.error('LayoutHelpers Error: ' + message);
        }
        else if (type === 'warning')
        {
            console.warn('LayoutHelpers Warning: ' + message);
        }
    }


    const _arrayToRGBA = function (opacity = 1) {

        let color = [...OPTIONS.gridColor];
        color.push(opacity);
        return 'rgba(' + color.join(', ') + ')';
    }


    const _getSettings = function (key) {

        if (!KEYS.hasOwnProperty(key))
            return false;

        let value = localStorage.getItem('layoutHelpers_' + key);

        return (value === null) ? '0' : value;
    }


    const _setSettings = function (key, state) {
        localStorage.setItem('layoutHelpers_' + key, state);
    }


    const _toggleLayoutHelpers = function () {

        const allInputs = document.querySelectorAll('input, textarea');
        let isInInput   = false;

        allInputs.forEach(function(elem) {
            elem.addEventListener('focus', function() {
                isInInput = true;
            });
            elem.addEventListener('blur', function() {
                isInInput = false;
            });
        });

        window.addEventListener('keydown', function(event) {

            if (isInInput === false)
            {
                if (!KEYS.hasOwnProperty(event.key))
                    return false;

                let key = event.key;

                if (key === 'g' || key === 'b')
                {
                    let layoutHelpersToggle = (key === 'g') ?
                        document.querySelector('.layout-helpers .layout-helpers__guides') :
                        document.querySelector('.layout-helpers .layout-helpers__breakpoints');
                    let state        = layoutHelpersToggle.getAttribute('data-visible');
                    state            = (state === '0') ? '1' : '0';
                    layoutHelpersToggle.setAttribute('data-visible', state);

                    _setSettings(key, state);
                }

                if (key === 'o')
                {
                    let layoutHelpersToggleClass = 'layout-helpers-outline';
                    let state = document.documentElement.classList.contains(layoutHelpersToggleClass);
                    state     = (state) ? '0' : '1';
                    document.documentElement.classList.toggle(layoutHelpersToggleClass);

                    _setSettings(key, state);
                }

            }

        });
    }


    const _constructLayoutHelpers = function () {

        if (!document.body)
        {
            _showMessage('Cannot find body of the document', 'error');
            return false;
        }

        const layoutHelpers = document.createElement('div');
        layoutHelpers.classList.add('layout-helpers');
        layoutHelpers.innerHTML = '' +
            '<div class="layout-helpers__guides">' +
            '   <div class="container' + (OPTIONS.gridFluid ? '-fluid' : '') + '">' +
            '       <div class="row"' + ((OPTIONS.gridOpacity !== 1) ? ' style="opacity: ' + OPTIONS.gridOpacity + '"' : '') + '></div>' +
            '   </div>' +
            '</div>' +
            '<div class="layout-helpers__breakpoints"></div>';

        layoutHelpers.querySelector('.layout-helpers__guides').setAttribute('data-visible', _getSettings('g'));
        layoutHelpers.querySelector('.layout-helpers__breakpoints').setAttribute('data-visible', _getSettings('b'));

        /* add guides */

        const colItem = document.createElement('div');
        colItem.classList.add('col-1');
        colItem.innerHTML = '<div class="guides-col" style="background-color: ' + _arrayToRGBA(0.25) + '"></div>';

        for (let i = 1; i <= OPTIONS.gridColumns; i++)
        {
            let colItemClone = colItem.cloneNode(true);
            colItemClone.querySelector('.guides-col').innerHTML = '<p style="color: ' + _arrayToRGBA(0.5) + '">' + i + '</p><p style="color: ' + _arrayToRGBA(0.5) + '">' + i + '</p>';
            layoutHelpers.querySelector('.layout-helpers__guides .row').append(colItemClone);
        }

        /* add breakpoints */

        const bptItem   = document.createElement('div');
        let i           = 0;
        let bptPrev     = '';

        for (let bptCurr in OPTIONS.breakpoints)
        {
            if (i === 0)
            {
                // skip
            }
            else
            {
                let bptItemClone = bptItem.cloneNode();
                if (i === 1)
                {
                    bptItemClone.classList.add('d-block', 'd-' + bptCurr + '-none');
                }
                else
                {
                    bptItemClone.classList.add('d-none', 'd-' + bptPrev + '-block', 'd-' + bptCurr + '-none');
                }

                bptItemClone.innerText = bptPrev + ' ≥ ' + OPTIONS.breakpoints[bptPrev] + 'px';
                layoutHelpers.querySelector('.layout-helpers__breakpoints').append(bptItemClone);
            }

            bptPrev = bptCurr;
            i++;
        }

        bptItem.classList.add('d-none', 'd-' + bptPrev + '-block');
        bptItem.innerText = bptPrev + ' ≥ ' + OPTIONS.breakpoints[bptPrev] + 'px';
        layoutHelpers.querySelector('.layout-helpers__breakpoints').append(bptItem);

        window.addEventListener('load', function() {
            document.body.prepend(layoutHelpers);
            _toggleLayoutHelpers();
        });
    }

    const init = function (options = {}) {

        let t0 = performance.now();

        if (options !== undefined && typeof options !== 'object')
        {
            _showMessage('Passing options should be an object', 'error')
            return false;
        }

        for (let key in options)
        {
            if (!OPTIONS.hasOwnProperty(key))
            {
                _showMessage('Option "' + key + '" does not exist', 'warning');
            }
            else
            {

                if (key === 'gridColumns')
                {
                    if (typeof options.gridColumns !== 'number' || options.gridColumns < 1 || options.gridColumns > 48)
                    {
                        _showMessage('Option "gridColumns" must be a type of number between 1 and 48', 'error')
                        return false;
                    }
                    OPTIONS.gridColumns = options.gridColumns;
                }

                if (key === 'gridFluid')
                {
                    if (typeof options.gridFluid !== 'boolean')
                    {
                        _showMessage('Option "gridFluid" must be a type of boolean', 'error')
                        return false;
                    }
                    OPTIONS.gridFluid = options.gridFluid;
                }

                if (key === 'gridColor')
                {
                    if (typeof options.gridColor === 'object' && options.gridColor.length === 3)
                    {

                        let checkGridColorValues = options.gridColor.every((value) => {
                            if (typeof value !== 'number')
                                return false;

                            return !(value < 0 || value > 255);
                        });

                        if (!checkGridColorValues)
                        {
                            _showMessage('Every element of "gridColor" array must be a number between 0 and 255', 'error')
                            return false;
                        }
                    }
                    else
                    {
                        _showMessage('Option "gridColor" must be an array of 3 numbers between 0 and 255', 'error')
                        return false;
                    }
                    OPTIONS.gridColor = options.gridColor;
                }

                if (key === 'gridOpacity')
                {
                    if (typeof options.gridOpacity !== 'number' || options.gridOpacity < 0 || options.gridOpacity > 1)
                    {
                        _showMessage('Option "gridOpacity" must be a number (or decimal) between 0 and 1', 'error')
                        return false;
                    }

                    OPTIONS.gridOpacity = options.gridOpacity;
                }

                if (key === 'breakpoints')
                {

                    if (typeof options.breakpoints === 'object')
                    {
                        for (let bptKey in options.breakpoints)
                        {
                            if (typeof bptKey !== 'string' || typeof options.breakpoints[bptKey] !== 'number')
                            {
                                _showMessage('Every object of "breakpoints" must be a pair of key string and numeric value', 'error')
                                return false;
                            }
                        }

                        if (options.breakpointsMethod !== 'expand' && options.breakpointsMethod !== 'replace')
                        {
                            _showMessage('Option "breakpointsMethod" should be either "expand" or "replace"', 'error')
                            return false;
                        }
                    }
                    else
                    {
                        _showMessage('Option "breakpoints" must be an array of objects', 'error')
                        return false;
                    }

                    if (options.breakpointsMethod === 'expand')
                    {
                        for (let bptKey in options.breakpoints)
                        {
                            OPTIONS.breakpoints[bptKey] = options.breakpoints[bptKey];
                        }
                    }
                    else
                    {
                        OPTIONS.breakpoints = options.breakpoints;
                    }

                }

            }
        }

        _constructLayoutHelpers();

        let t1 = performance.now();
        console.log('Layout Helpers initialized for ' + (t1 - t0) + ' milliseconds.');

    }

    return {
        init: init
    }

}();
