/******************************************************************************
 * VetPara Atlas
 * File: utils.js
 ******************************************************************************/

export function $(selector) {

    return document.querySelector(selector);

}

export function $all(selector) {

    return document.querySelectorAll(selector);

}

export function createElement(tag, className = "") {

    const element = document.createElement(tag);

    if (className) {

        element.className = className;

    }

    return element;

}

export function clear(element) {

    while (element.firstChild) {

        element.removeChild(element.firstChild);

    }

}
