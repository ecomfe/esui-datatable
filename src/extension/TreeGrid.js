/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2016 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file TreeGrid
 * @author hongfeng(hongfeng@baidu.com)
 */
define(
    function (require) {
        var esui = require('esui/main');
        var Extension = require('esui/Extension');
        var eoo = require('eoo');
        var DataTable = require('../DataTable');
        var $ = require('jquery');
        var _ = require('underscore');
        require('datatables-treegrid');

        /**
         * 表格子行扩展
         *
         * @constructor
         */
        var TreeGrid = eoo.create(
            Extension,
            {
                /**
                 * 指定扩展类型，始终为`"TreeGrid"`
                 *
                 * @type {string}
                 */
                type: 'TreeGrid',

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

                    /**
                     * 获取Table的选中数据项
                     *
                     * @param {boolean} children 是否包含子节点
                     * @return {Array}
                     */
                    target.getSelectedItems = function (children) {
                        var dataTable = this.dataTable;
                        var rows = dataTable.rows({selected: true});
                        if (children) {
                            return rows.data().toArray();
                        }

                        var indexes = rows.indexes().toArray();
                        var data = [];
                        _.map(rows.nodes(), function (node) {
                            var row = dataTable.row($(node));
                            var parentIndex = $(row.node()).attr('parent-index');
                            if (parentIndex == null || !_.contains(indexes, +parentIndex)) {
                                data.push(row.data());
                            }
                        });
                        return data;
                    };

                    var options = target.getDataTableExtendOptions();
                    target.getDataTableExtendOptions = function () {
                        return _.extend(options, {
                            treeGrid: {
                                left: this.treeGridLeft,
                                expandIcon: this.plusIcon,
                                collapseIcon: this.minusIcon
                            },
                            select: this.select
                        });
                    };

                    var originalBindEvents = target.bindEvents;

                    target.bindEvents = function () {
                        originalBindEvents.call(target);

                        target.dataTable.on('click', 'td.treegrid-control', function () {
                            target.resetBodyClass(target.fields);
                            target.resetSelectMode(target.selectMode);
                            target.resetSelect(target.select);
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

        esui.registerExtension(TreeGrid);
        return TreeGrid;
    }
);
