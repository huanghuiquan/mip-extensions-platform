/**
 * @file 头部滑动并显示当前栏目
 * @author 233 程序部
 */
define(function (require) {
    var $ = require('zepto');
    var customElem = require('customElement').create();
    // build 方法，元素插入到文档时执行，仅会执行一次
    customElem.prototype.build = function () {
        var element = this.element;
        var width = $(element).find('.channel').width() * ($(element).find('.channel').length - 1) + 49;
        var name = location.href.split('/')[location.href.split('/').length - 2];
        var list = $(element).find('.channel');
        var index = 0;
        for (var gg = 0; gg < list.length; gg++) {
            if ($(list[gg]).find('a').attr('href').indexOf(name) > -1) {
                index = gg;
            }
        }
        $(element).find('ul').width(width);
        if (index > 0) {
            $(element).find('.topnav_list').scrollLeft(($(element).find('.channel').width() * index));
        }
        $(element).find('.channel').eq(index).addClass('curr');
    };
    return customElem;
});
