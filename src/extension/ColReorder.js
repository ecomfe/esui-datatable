/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2016 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file ColReorder
 * @author chuzhenyang(chuzhenyang@baidu.com)
 */
define(
    function (require) {
        var esui = require('esui/main');
        var Extension = require('esui/Extension');
        var eoo = require('eoo');
        var DataTable = require('../DataTable');
        require('datatables-colreorder');
        var u = require('underscore');

        /**
         * 表格子行扩展
         *
         * @constructor
         */
        var ColReorder = eoo.create(
            Extension,
            {
                /**
                 * 指定扩展类型，始终为`"ColReorder"`
                 *
                 * USEAGE:
                 *        要配置一个属性
                 *        colReorder: 是否使用ColReorder扩展(true/false)
                 * @type {string}
                 */
                type: 'ColReorder',

                /**
                 * 激活扩展
                 *
                 * @override
                 */
                activate: function () {
                    var target = this.target;
                    // 只对`DataTable`控件生效
                    if (!(target instanceof DataTable)) {
                        return;
                    }

                    var options = target.getDataTableExtendOptions();
                    target.getDataTableExtendOptions = function () {
                        return u.extend(options, {
                            colReorder: this.colReorder
                        });
                    };

                    var originalBindEvents = target.bindEvents;

                    target.bindEvents = function () {
                        originalBindEvents.call(this);

                        this.dataTable.on('column-reorder', function (e, settings, details) {
                            target.fire('columnreorder', {
                                from: details.from,
                                to: details.to
                            });
                        });
                    };
                },

                /**
                 * 取消扩展的激活状态
                 *
                 * @override
                 */
                inactivate: function () {
                    var target = this.target;
                    // 只对`DataTable`控件生效
                    if (!(target instanceof DataTable)) {
                        return;
                    }

                    this.$super(arguments);
                }
            }
        );

        esui.registerExtension(ColReorder);
        return ColReorder;
    }
);
