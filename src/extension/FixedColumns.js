/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2016 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file FixedColumns
 * @author chuzhenyang(chuzhenyang@baidu.com)
 */

 // TODO: 还有几个bug要处理
 //       1. 与followHead一起用会有一些问题
 //       3. 窗口缩放后有可能出现滚动不同步的现象
define(
    function (require) {
        var esui = require('esui/main');
        var Extension = require('esui/Extension');
        var eoo = require('eoo');
        var DataTable = require('../DataTable');
        var u = require('underscore');
        var $ = require('jquery');
        require('datatables-fixedcolumns');

        /**
         * 表格子行扩展
         *
         * USEAGE:
         *        要配置三个属性
         *        fixedColumns: 是否使用FixedColumns扩展(true/false)
         *        leftFixedColumns: 左侧列fixed的个数(number)
         *        rightFixedColumns: 右侧列fixed的个数(number)
         * @constructor
         */
        var FixedColumns = eoo.create(
            Extension,
            {
                /**
                 * 指定扩展类型，始终为`"FixedColumns"`
                 *
                 * @type {string}
                 */
                type: 'FixedColumns',

                /**
                 * 激活扩展
                 *
                 * @override
                 */
                activate: function () {
                    var target = this.target;
                    // 只对`DataTable`控件生效
                    if (!(target instanceof DataTable && target.fixedColumns)) {
                        return;
                    }


                    var options = target.getDataTableExtendOptions();
                    target.getDataTableExtendOptions = function () {
                        var leftFixedColumns = this.leftFixedColumns;
                        !target.select && leftFixedColumns++;
                        var fixedColumnsOption = {
                            fixedColumns: {
                                leftColumns: leftFixedColumns,
                                rightColumns: this.rightFixedColumns
                            }
                        };
                        if (this.colReorder) {
                            fixedColumnsOption = u.extend(fixedColumnsOption, {
                                colReorder: {
                                    fixedColumnsLeft: leftFixedColumns,
                                    fixedColumnsRight: this.rightFixedColumns
                                }
                            });
                        }
                        return u.extend(options, fixedColumnsOption);
                    };

                    var originalResetSortable = target.resetSortable;
                    var originalResetSelect = target.resetSelect;
                    var originalResetSelectMode = target.resetSelectMode;
                    var originalResetFieldOrderable = target.resetFieldOrderable;
                    var originalSetAllRowSelected = target.setAllRowSelected;
                    var originalHeadReseter = target.headReseter;

                    target.resetSortable = function (sortable) {
                        originalResetSortable.call(this, sortable);
                        this.dataTable.fixedColumns().relayout();
                    };

                    target.resetSelect = function (select) {
                        originalResetSelect.call(this, select);
                        this.dataTable.fixedColumns().relayout();
                    };

                    target.resetSelectMode = function (selectMode) {
                        originalResetSelectMode.call(this, selectMode);
                        this.dataTable.fixedColumns().relayout();
                    };

                    target.resetFieldOrderable = function (orderBy, order) {
                        originalResetFieldOrderable.call(this, orderBy, order);
                        this.dataTable.fixedColumns().relayout();
                    };

                    target.setAllRowSelected = function (isSelected) {
                        originalSetAllRowSelected.call(this, isSelected);
                        var fixedColumnsDom = this.dataTable.fixedColumns().settings()[0]._oFixedColumns.dom.clone;
                        var leftHeader = fixedColumnsDom.left.header;
                        if (leftHeader) {
                            $('tr', leftHeader).toggleClass('selected');
                        }
                    };

                    target.headReseter = function () {
                        originalHeadReseter.call(this);
                        var headerPosition = $(this.dataTable.table().header()).parent().css('position');
                        setFixedColumnsHeaderStyle(this, headerPosition);
                    };

                    this.$super(arguments);
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

        /**
         * 设置fixedHeader的style
         *
         * @param {ui.DataTable} table table控件实例
         * @param {string} type 要设置的type
         * @private
         */
        function setFixedColumnsHeaderStyle(table, type) {
            var fixedColumnsDom = table.dataTable.fixedColumns().settings()[0]._oFixedColumns.dom.clone;
            var leftHeader = fixedColumnsDom.left.header;
            var rightHeader = fixedColumnsDom.right.header;
            var leftHeaderWidth = $(leftHeader).width();
            var rightHeaderWidth = $(rightHeader).width();
            var positionStyle = {
                position: type
            };
            var fixedStyle = {
                'top': table.followHeadOffset,
                'z-index': table.zIndex + 2
            };
            if (type === 'fixed') {
                $(leftHeader).css(u.extend(positionStyle, fixedStyle, {width: leftHeaderWidth}));
                $(rightHeader).css(u.extend(positionStyle, fixedStyle, {width: rightHeaderWidth}));
            }
            else if (type === 'static') {
                $(leftHeader).css(u.extend(positionStyle, {width: leftHeaderWidth}));
                $(rightHeader).css(u.extend(positionStyle, {width: rightHeaderWidth}));
            }
        }

        esui.registerExtension(FixedColumns);
        return FixedColumns;
    }
);
