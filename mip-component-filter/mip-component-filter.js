/**
 * @file mip-component-filter 组件
 * @author
 */

define(function (require) {
    'use strict';

    let customElement = require('customElement').create();

    /**
     * 第一次进入可视区回调，只会执行一次
     */
    customElement.prototype.firstInviewCallback = function () {
        let element = this.element;
        let util = require('util');
        let dom = {
            btnDropdown: element.querySelector('.btn-dropdown'),
            mask: element.querySelector('.mask'),
            btnBack: element.querySelector('.search-line').firstElementChild,
            btnSearch: element.querySelector('.search-line').querySelector('.btn-default')
        };
        let open = function () {
            dom.mask.classList.add('show');
        };
        let close = function () {
            let mask = dom.mask;
            if (event.target === mask || event.target === dom.btnBack) {
                mask.classList.remove('show');
            }
        };
        let search = function () {
            let value = event.target.previousElementSibling.value;
            let url = event.target.dataset.url;
            window.top.location.href = url + value;
        };
        let getWare = function () {
            let loadid = event.target.dataset.loadid;
            let loadname = event.target.dataset.loadname;
            let template = event.target.parentElement.dataset.template;
            let templateall = event.target.parentElement.dataset.templateall;
            let getUrl = event.target.parentElement.dataset.url;
            fetch(getUrl + loadid).then(function (response) {
                return response.text();
            }).then(function (text) {
                let data = JSON.parse(text);
                let linkTemplate = '<a data-type="mip" href="{0}">{1}</a>';
                let html = linkTemplate.replace('{0}', (loadname ? template.replace('{0}', loadname) : templateall))
                    .replace('{1}', '全部');
                for (let item in data) {
                    html += linkTemplate.replace('{0}', template.replace('{0}', data[item].LoadName))
                        .replace('{1}', data[item].Name);
                }
                element.querySelector('.filter-box').innerHTML = html;
            });
        };
        dom.btnDropdown.addEventListener('click', open);
        dom.mask.addEventListener('click', close);
        dom.btnBack.addEventListener('click', close);
        dom.btnSearch.addEventListener('click', search);
        util.event.delegate(element.querySelector('.scroll-filter'), 'button', 'click', getWare);
    };

    return customElement;
});
