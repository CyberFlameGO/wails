/*
 _	   __	  _ __
| |	 / /___ _(_) /____
| | /| / / __ `/ / / ___/
| |/ |/ / /_/ / / (__  )
|__/|__/\__,_/_/_/____/
The electron alternative for Go
(c) Lea Anthony 2019-present
*/
/* jshint esversion: 9 */
import * as Log from './log';
import {eventListeners, EventsEmit, EventsNotify, EventsOff, EventsOn, EventsOnce, EventsOnMultiple} from './events';
import {Call, Callback, callbacks} from './calls';
import {SetBindings} from "./bindings";
import * as Window from "./window";
import * as Browser from "./browser";


export function Quit() {
    window.WailsInvoke('Q');
}

export function Environment() {
    return Call(":wails:Environment");
}

// The JS runtime
window.runtime = {
    ...Log,
    ...Window,
    ...Browser,
    EventsOn,
    EventsOnce,
    EventsOnMultiple,
    EventsEmit,
    EventsOff,
    Environment,
    Quit
};

// Internal wails endpoints
window.wails = {
    Callback,
    EventsNotify,
    SetBindings,
    eventListeners,
    callbacks,
    flags: {
        disableScrollbarDrag: false,
        disableWailsDefaultContextMenu: false,
        enableResize: false,
        defaultCursor: null,
        borderThickness: 6,
        dbClickInterval: 100,
    }
};

// Set the bindings
window.wails.SetBindings(window.wailsbindings);
delete window.wails.SetBindings;

// This is evaluated at build time in package.json
// const dev = 0;
// const production = 1;
if (ENV === 0) {
    delete window.wailsbindings;
}

var dragTimeOut;
var dragLastTime = 0;

function drag() {
    window.WailsInvoke("drag");
}

// Setup drag handler
// Based on code from: https://github.com/patr0nus/DeskGap
window.addEventListener('mousedown', (e) => {

    // Check for resizing
    if (window.wails.flags.resizeEdge) {
        window.WailsInvoke("resize:" + window.wails.flags.resizeEdge);
        e.preventDefault();
        return;
    }

    // Check for dragging
    let currentElement = e.target;
    while (currentElement != null) {
        if (currentElement.hasAttribute('data-wails-no-drag')) {
            break;
        } else if (currentElement.hasAttribute('data-wails-drag')) {
            if (window.wails.flags.disableScrollbarDrag) {
                // This checks for clicks on the scroll bar
                if (e.offsetX > e.target.clientWidth || e.offsetY > e.target.clientHeight) {
                    break;
                }
            }
            if (new Date().getTime() - dragLastTime < window.wails.flags.dbClickInterval) {
                clearTimeout(dragTimeOut);
                break;
            }
            dragTimeOut = setTimeout(drag, window.wails.flags.dbClickInterval);
            dragLastTime = new Date().getTime();
            e.preventDefault();
            break;
        }
        currentElement = currentElement.parentElement;
    }
});

function setResize(cursor) {
    document.body.style.cursor = cursor || window.wails.flags.defaultCursor;
    window.wails.flags.resizeEdge = cursor;
}

window.addEventListener('mousemove', function (e) {
    if (!window.wails.flags.enableResize) {
        return;
    }
    if (window.wails.flags.defaultCursor == null) {
        window.wails.flags.defaultCursor = document.body.style.cursor;
    }
    if (window.outerWidth - e.clientX < window.wails.flags.borderThickness && window.outerHeight - e.clientY < window.wails.flags.borderThickness) {
        document.body.style.cursor = "se-resize";
    }
    let rightBorder = window.outerWidth - e.clientX < window.wails.flags.borderThickness;
    let leftBorder = e.clientX < window.wails.flags.borderThickness;
    let topBorder = e.clientY < window.wails.flags.borderThickness;
    let bottomBorder = window.outerHeight - e.clientY < window.wails.flags.borderThickness;

    // If we aren't on an edge, but were, reset the cursor to default
    if (!leftBorder && !rightBorder && !topBorder && !bottomBorder && window.wails.flags.resizeEdge !== undefined) {
        setResize();
    } else if (rightBorder && bottomBorder) setResize("se-resize");
    else if (leftBorder && bottomBorder) setResize("sw-resize");
    else if (leftBorder && topBorder) setResize("nw-resize");
    else if (topBorder && rightBorder) setResize("ne-resize");
    else if (leftBorder) setResize("w-resize");
    else if (topBorder) setResize("n-resize");
    else if (bottomBorder) setResize("s-resize");
    else if (rightBorder) setResize("e-resize");

});

// Setup context menu hook
window.addEventListener('contextmenu', function (e) {
    if (window.wails.flags.disableWailsDefaultContextMenu) {
        e.preventDefault();
    }
});