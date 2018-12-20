/**
 * @file mip-jia-zxpacket 组件
 * @author
 */

define(function (require) {

    var customElement = require('customElement').create();
    var fixedElement = require('fixed-element');
    var $ = require('zepto');
    var fetchJsonp = require('fetch-jsonp');
    var util = require('util');
    var Gesture = util.Gesture;
    var CustomStorage = util.customStorage;
    var storage = new CustomStorage(0);
    var scrollTop = {
        body: 0,
        documentElement: 0,
        offset: 0
    };

    /**
     * [open 打开弹层 关闭fixedLayer]
     *
     * @param  {Object} event [事件对象]
     */
    function open(event) {

        var self = this;

        fixedElement.hideFixedLayer(fixedElement._fixedLayer);
        event.preventDefault();
        /*if (!self.scroll) {
            new Gesture(self.element, {
                preventY: true
            });
        }*/

        // 保存页面当前滚动状态，因为设置overflow:hidden后页面会滚动到顶部
        scrollTop.body = document.body.scrollTop;
        scrollTop.documentElement = document.documentElement.scrollTop;
        scrollTop.offset = window.pageYOffset;
        document.documentElement.classList.add('mip-no-scroll');
    }

    /**
     * [close 关闭弹层 打开fixedLayer]
     *
     * @param  {Object} event [事件对象]
     */
    function close(event) {
        fixedElement.showFixedLayer(fixedElement._fixedLayer);
        if (event) {
            event.preventDefault();
        }

        document.documentElement.classList.remove('mip-no-scroll');

        // 恢复页面滚动状态到弹层打开之前
        if (typeof (document.body.scrollTo) === 'function') {
            // 先判断存在，因为safari浏览器没有document.body.scrollTo方法
            document.body.scrollTo(0, scrollTop.body);
        }
        if (typeof (document.documentElement.scrollTo) === 'function') {
            // 先判断存在，因为safari浏览器没有document.documentElement.scrollTo方法
            document.documentElement.scrollTo(0, scrollTop.documentElement);
        }
        window.scrollTo(0, scrollTop.offset);
    }

    var TYPE = 'script[type="application/json"]';
    var regPhone = /^1[3|4|5|7|8]\d{9}$/;

    function jsonParse(json) {
        try {
            return JSON.parse(json);
        }
        catch (e) {
            console.error(e);
            return false;
        }
    }

    /**
     * 加密手机号
     *
     * @class
     * @param {string} phone 手机号
     * @param {string} key 加密key
     */
    function mobileEncrypt(phone, key) {
        /* global JSEncryptExports */
        var JSEncrypt = new JSEncryptExports.JSEncrypt();
        JSEncrypt.setKey(key);

        // base64编码在传输到后端的时候，+会变成空格，因此替换掉
        var ep = JSEncrypt.encrypt(phone).replace(/\+/g, '%2B');

        return ep;
    }

    /**
     * 加密手机号
     *
     * @class
     * @param {string} url 获取rsaPubKey接口地址
     * @return {Object}  返回旺铺key
     */
    function getRsaPubKey(url) {
        var promise = new Promise(function (resolve, reject) {
            fetch(url, {
                mode: 'cors',
                method: 'get',
                credentials: 'include'
            }).then(function (res) {
                if (res.ok) {
                    resolve(res);
                }
                else {
                    reject(new Error(this.statusText));
                }
            }).catch(function (err) {
                console.log('Fetch错误:' + err);
            });
        });
        return promise;
    }

    // 装修加密key
    var zxKey = [
        'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC8hgXGmTam',
        '/ZBj9q8UteZ+1Z0sja7g7gQBR1RxfVJBbxGMwLgmW2uc+ij4F',
        'fFsr6poM2IO64JfDxl+9H1tmEq6kEmuju7ue4b/4KcMTftKGjr+',
        'DtbNiwtFhLKIU6iQRKjetWor8pj7/arhR5weSh04AWwEFQNsQchq',
        'M2eA7gEs2wIDAQAB'
    ].join('');


    // 提示层
    var tipMaskTimer = null;

    function tipMask(msg, duration) {
        clearTimeout(tipMaskTimer);
        duration = duration || 2000;
        if ($('.popup-maskEdit').length > 0) {
            $('.popup-maskEdit').remove();
        }
        $('body').append('<div class="popup-maskEdit">' + msg + '</div>');
        tipMaskTimer = setTimeout(function () {
            $('.popup-maskEdit').fadeOut(100, function () {
                $(this).remove();
            });
        }, duration);
    }

    // 需要提前加载，所以用build
    customElement.prototype.build = function () {
        var ele = this.element;
        /* global MIP */
        MIP.prerenderElement(ele);

        // 加密依赖
        /* global JSEncryptExports */
        if (typeof JSEncryptExports === 'undefined') {
            var scriptDom = document.createElement('script');
            scriptDom.src = '//mued2.jia.com/js/mobile/jsencrypt.js';
            document.body.appendChild(scriptDom);
        }
    };

    // 红包
    function RedPacket(element, cfg) {
        this.cfg = cfg;
        this.element = element;
    }

    function countEle(time) {
        var day = Math.floor(time / (3600 * 24));
        var hour = Math.floor((time - day * 3600 * 24) / 3600);
        var minutes = Math.floor((time - day * 3600 * 24 - hour * 3600) / 60);
        minutes < 10 ? minutes = '0' + minutes : minutes;
        var second = Math.floor(time - day * 3600 * 24 - hour * 3600 - minutes * 60);
        second < 10 ? second = '0' + second : second;
        var msg = '';
        if (time !== 0) {
            msg += '倒计时：';
        }
        if (day !== 0) {
            msg += day + '天' + hour + '时' + minutes + '分' + second + '秒';
        }
        else if (hour !== 0) {
            msg += hour + '时' + minutes + '分' + second + '秒';
        }
        else if (minutes !== 0) {
            msg += minutes + '分' + second + '秒';
        }
        else if (second !== 0) {
            msg += second + '秒';
        }
        return msg;
    }

    // 倒计时
    function countTimeFn(timerEle, ele, time) {
        var originalTime = time;
        $(ele).html(countEle(time));
        window.clearInterval(timerEle.timer);
        timerEle.timer = null;
        timerEle.timer = setInterval(function () {
            time--;
            if (time < 0) {
                countTimeFn(timerEle, ele, originalTime);
            } else {
                $(ele).html(countEle(time));
            }
        }, 1000);
    }

    // 添加红包html
    RedPacket.prototype.appendEle = function () {
        /*var str = '<mip-fixed still type="right" class="fixed-hb">';
        str += '<div class="hb-box">' + this.cfg.text + '</div>';
        str += '</mip-fixed>';*/
        var str = '';
        str += '<div class="hb-popup">';
        str += '<div class="popup-box">';
        str += '<em class="close"></em>';
        str += '<div class="hbinfo-box">';
        str += '<h5 class="tit"><span>' + this.cfg.hbinfo.title + '</span></h5>';
        str += '<div class="img-box"></div>';
        // str += '<mip-img src="'+this.cfg.hbinfo.img+'"></mip-img>';
        str += '<div class="info-box">';
        str += '<p class="t">' + this.cfg.hbinfo.tit + '</p>';
        str += '<div class="tag-box">';
        if (this.cfg.hbinfo.tag) {
            str += '<p class="tag">';
            var arr1 = this.cfg.hbinfo.tag.split('-');
            arr1.forEach(function (a, b) {
                str += '<span>' + a + '</span>';
            });
            str += '</p>';
        }
        str += '<p class="count-box"></p>';
        str += '</div>';
        str += '</div>';

        str += '<div class="form-box">';
        str += '<div class="input-box">';
        str += '<input type="tel" class="form-input" maxlength="11" placeholder="请输入您的手机号" />';
        str += '</div>';
        str += '<span class="headline-btn">立即领取</span>';
        str += '</div>';
        str += '</div>';

        str += '<h5 class="title">' + this.cfg.title + '</h5>';
        if ($.isArray(this.cfg.list)) {
            str += '<ul class="list">';
            this.cfg.list.forEach(function (item, index) {
                str += '<li class="' + (item.class || '') + '"><a href="' + item.href + '">';
                str += '<div class="img-box">';
                // str += '<mip-img src="'+item.img+'"></mip-img>';
                str += '</div>';
                str += '<div class="info-box">';
                str += '<p class="tit">' + item.title + '</p>';
                if (item.tag) {
                    str += '<p class="tag">';
                    var arr = item.tag.split('-');
                    arr.forEach(function (a, b) {
                        str += '<span>' + a + '</span>';
                    });
                    str += '</p>';
                }
                str += '<p class="txt">' + item.desc + '</p>';
                str += '<span class="btn">' + item.btntxt + '</span>';
                str += '</div></a></li>';
            });
            str += '</ul>';
        }

        str += '</div>';
        str += '</div>';
        str += '<div class="popmask"></div><div class="loading-icon"></div>';

        $(this.element).append(str);
    };

    /**
     * 领取红包
     *
     * @class
     * @param {string} url 接口地址
     * @param {string} parms 接口参数
     * @return {Promise}
     */
    RedPacket.prototype.getRed = function (url, parms) {
        var selF = this;
        var tips = $(this.element).find('.loading-icon');
        tips.css('display', 'block');
        return new Promise(function (resolve, reject) {
            fetchJsonp(url + '?parameters=' + JSON.stringify(parms), {
                jsonpCallback: 'callback'
            }).then(function (res) {
                tips.css('display', 'none');
                return res.json();
            }).then(function (data) {
                if (data.obtainResult === 'SUCCESS'
                    || data.obtainResult === 'OBTAINING'
                    || data.obtainResult === 'USER_NOT_EXIST') {
                    return resolve();
                } else if (data.obtainResult === 'REACH_OBTAIN_UPPER_LIMIT') {
                    tipMask('您已领取过该红包~');
                    $(selF.element).find('.popmask').css('display', 'none');
                    $(selF.element).find('.hb-popup').removeClass('show');
                    close();
                } else {
                    tipMask(data.message);
                }
            });
        });

    };

    /**
     * 获取城市
     *
     * @class
     * @param {string} url 接口地址
     * @return {Promise}
     */
    RedPacket.prototype.getCity = function (url) {
        return new Promise(function (resolve, reject) {
            if (!storage.get('city')) {
                fetchJsonp(url, {
                    jsonpCallback: 'callback'
                }).then(function (res) {
                    return res.json();
                }).then(function (data) {
                    if (data.code !== 0) {
                        var city = data.result.site.area_info;
                        storage.set('city', JSON.stringify(city), 21600000);
                        return resolve(city.area_py);
                    } else {
                        console.log(data.msg);
                    }
                });
            } else {
                var city = JSON.parse(storage.get('city')).area_py;
                return resolve(city);
            }
        });

    };


    /**
     * 装修报名
     *
     * @class
     * @param {string} url 接口地址
     * @param {string} parms 接口参数
     * @return {Promise}
     */
    RedPacket.prototype.signUp = function (url, parms) {
        return new Promise(function (resolve, reject) {
            fetchJsonp(url + '?' + parms, {
                jsonpCallback: 'callback'
            }).then(function (res) {
                return res.json();
            }).then(function (data) {
                if (data.status === 200) {
                    return resolve();
                } else {
                    tipMask(data.info);
                }
            });
        });
    };


    /**
     * 第一次进入可视区回调，只会执行一次
     */
    customElement.prototype.firstInviewCallback = function () {
        var self = this;
        var ele = this.element;
        var datas = this.element.querySelector(TYPE);
        var cfg = jsonParse(datas.textContent);
        var redPacket = new RedPacket(ele, cfg);
        var isAndroid = /Android/i.test(navigator.userAgent);

        // 添加
        redPacket.appendEle();

        // 倒计时
        countTimeFn(ele, $(ele).find('.count-box'), cfg.counttime || 600);

        // 显示弹层
        $(cfg.class).click(function (event) {
            $(ele).find('.popmask').css('display', 'block');
            $(ele).find('.hb-popup').addClass('show');
            open.call(self, event);
        });

        // 关闭弹层
        $(ele).find('.close, .popmask').click(function (event) {
            $(ele).find('.popmask').css('display', 'none');
            $(ele).find('.hb-popup').removeClass('show');
            close.call(self, event);
        });

        /*if (isAndroid) {
            $(ele).find('.form-input').on({
                focus: function () {
                    $(ele).find('.popup-box').addClass('focus');
                },
                blur: function () {
                    $(ele).find('.popup-box').removeClass('focus');
                }
            });
        }*/

        // 点击报名
        $(ele).find('.headline-btn').click(function () {
            var tel = $(ele).find('.form-input');
            if (!regPhone.test(tel.val())) {
                tipMask('请输入正确的手机号~');
                return;
            }
            var redParms = cfg.redRequest.parms;

            var signParms = cfg.signRequest.parms;
            var pArray = [];
            for (var key in signParms) {
                if (signParms.hasOwnProperty(key)) {
                    pArray.push(key.concat('=', signParms[key]));
                }
            }

            // 报名成功页所需参数
            var bmPramas = {};

            // 回调拆分一
            function stepOne(key) {
                var redPhone = mobileEncrypt(tel.val(), key);
                redParms.mobileNumber = redPhone;

                // 领取红包
                redPacket.getRed(cfg.redRequest.url, redParms).then(function () {
                    stepTwo();
                });
            }

            // 回调拆分二
            function stepTwo() {
                // 获取城市
                redPacket.getCity(cfg.cityUrl).then(function (city) {
                    var zxPhone = mobileEncrypt(tel.val(), zxKey);
                    pArray.push('mobile=' + zxPhone);
                    pArray.push('city=' + city);
                    bmPramas.zxphone = zxPhone;
                    bmPramas.zxcity = city;

                    // 装修报名
                    redPacket.signUp(cfg.signRequest.url, pArray.join('&')).then(function () {

                        // 种cookie并跳转到成功页
                        bmPramas['refer_url'] = window.location.href;
                        bmPramas['from_source'] = signParms.source;
                        bmPramas = JSON.stringify(bmPramas);
                        storage.set('bm_pramas', bmPramas);
                        window.top.location.href = cfg.signRequest.skipUrl;
                    });
                });
            }

            // 获取旺铺加密KEY
            getRsaPubKey(cfg.keyUrl).then(function (res) {
                res.text().then(function (key) {
                    stepOne(key);
                });
            });
        });

    };

    return customElement;
});
