/**
 * ESUI (Enterprise Simple UI)
 * Copyright 2016 Baidu Inc. All rights reserved.
 *
 * @ignore
 * @file DataTable
 * @author chuzhenyang(chuzhenyang@baidu.com)
 *         hongfeng(hongfeng@baidu.com)
 */
define(
    function (require) {
        var u = require('underscore');
        var Control = require('esui/Control');
        var painters = require('esui/painters');
        var esui = require('esui/main');
        var eoo = require('eoo');
        var lib = require('esui/lib');
        var $ = require('jquery');
        var Event = require('mini-event');
        require('datatables.net');
        require('datatables-select');

        var DataTable = eoo.create(
            Control,
            {
                /**
                 * 控件类型，始终为`"DataTable"`
                 *
                 * @type {string}
                 * @readonly
                 * @override
                 */
                type: 'DataTable',

                /**
                 * 初始化参数
                 *
                 * 如果初始化时提供了主元素，则使用主元素的标签名作为{@link DataTable#tagName}属性
                 *
                 * 如果未提供{@link DataTable#text}属性，则使用主元素的文本内容作为此属性的初始值
                 *
                 * @param {Object} [options] 构造函数传入的参数
                 * @override
                 * @protected
                 */
                initOptions: function (options) {
                    var properties = {
                        handlers: [],
                        selectedIndex: []
                    };

                    u.extend(properties, DataTable.defaultProperties, options, options.extendOptions);
                    this.setProperties(properties);
                },

                initStructure: function () {
                    this.main.style.zIndex = this.zIndex || '';
                },

                /**
                 * 设置Table的datasource，并强制更新
                 *
                 * @public
                 * @param {Object} datasource 数据源
                 */
                setDatasource: function (datasource) {
                    this.datasource = datasource;
                    this.dataTable.clear();
                    this.dataTable.data().rows.add(datasource);
                    this.dataTable.draw();
                    $('tr', this.dataTable.table().header()).removeClass('selected');
                    this.resetSelect(this.select);
                    this.fire('bodyChange');
                    this.fire('select', {selectedIndex: []});
                },

                /**
                 * 设置所有行选中
                 *
                 * @param {boolean} isSelected 是否选中
                 * @public
                 */
                setAllRowSelected: function (isSelected) {
                    if (this.select !== 'multi') {
                        return;
                    }
                    // if (this.clientPaging) {
                    //     var info = this.dataTable.page.info();
                    //     var start = info.start;
                    //     var end = info.end;
                    //     for (var index = start; index < end; index++) {
                    //         isSelected ? this.dataTable.row(index).select() : this.dataTable.row(index).deselect();
                    //     }
                    //     return;
                    // }
                    isSelected ? this.dataTable.rows().select() : this.dataTable.rows().deselect();
                },

                /**
                 * 设置指定行号选中
                 *
                 * @param {Object|Array} indexes 行号数组
                 * @param {boolean} isSelected 是否选中
                 */
                setRowsSelected: function (indexes, isSelected) {
                    if (this.select === 'multi') {
                        isSelected
                            ? this.dataTable.rows(indexes).select()
                            : this.dataTable.rows(indexes).deselect();
                    }
                },

                /**
                 * 设置行选中
                 *
                 * @param {number|Array} index 行号
                 * @param {boolean} isSelected 是否选中
                 * @public
                 */
                setRowSelected: function (index, isSelected) {
                    if (this.select !== 'multi' && this.select !== 'single') {
                        return;
                    }
                    isSelected ? this.dataTable.row(index).select() : this.dataTable.row(index).deselect();
                    if (isAllRowSelected(this)) {
                        $('tr', this.dataTable.table().header()).addClass('selected');
                    }
                    else {
                        $('tr', this.dataTable.table().header()).removeClass('selected');
                    }
                },

                /**
                 * 获取Table的选中数据项
                 *
                 * @public
                 * @return {Array}
                 */
                getSelectedItems: function () {
                    return this.dataTable.rows({selected: true}).data().toArray();
                },

                /**
                 * 获取选中的行号
                 *
                 * @return {Array}
                 */
                getSelectedIndexes: function () {
                    return this.dataTable.rows({selected: true}).indexes().toArray();
                },

                /**
                 * 设置单元格的文字
                 *
                 * @public
                 * @param {string} text 要设置的文字
                 * @param {string} rowIndex 行序号
                 * @param {string} columnIndex 列序号
                 * @param {boolean=} isEncodeHtml 是否需要进行html转义
                 */
                setCellText: function (text, rowIndex, columnIndex, isEncodeHtml) {
                    if (isEncodeHtml) {
                        text = u.escape(text);
                    }
                    text = isNullOrEmpty(text) ? '&nbsp' : text;
                    var cell = this.dataTable.cell(rowIndex, columnIndex);
                    cell.node().innerHTML = text;
                },


                /**
                 * 提供一个datatable初始化时补充配置的接口
                 *
                 * @public
                 * @return {Object}
                 */
                getDataTableExtendOptions: function () {
                    return {};
                },

                /**
                 * 初始化表格体子控件
                 *
                 * @protected
                 * @param {number} index 行数
                 * @return {Element}
                 */
                getRow: function (index) {
                    return this.dataTable.row(index).node();
                },

                 /**
                 * 自适应表格宽度
                 *
                 * @public
                 */
                adjustWidth: function () {
                    // TODO: 一旦draw了就整个重绘了 代价是不是有点大？
                    this.dataTable.columns.adjust();
                },

                /**
                 * 重新绘制Table某行
                 *
                 * @param {number} index 行数
                 * @param {Object} data 该行对应的数据源
                 * @public
                 */
                updateRowAt: function (index, data) {
                    if (-1 < index && index < this.datasource.length && data) {
                        var oldData = this.datasource[index];
                        if (!u.isEqual(data, oldData)) {
                            var rowEl = this.dataTable.row(index);
                            this.fire(
                                'beforerowupdate',
                                {index: index, data: oldData, nextData: data}
                            );

                            this.datasource[index] = data;
                            rowEl.data(data).draw();

                            this.fire(
                                'afterrowupdate',
                                {index: index, data: data, prevData: oldData}
                            );
                        }
                    }
                },

                /**
                 * 初始化事件交互
                 *
                 * @protected
                 * @override
                 */
                bindEvents: function () {
                    var that = this;
                    var dataTable = this.dataTable;
                    var header = dataTable.table().header();
                    var headerTr = $('tr', header);
                    var scrollContainer = $(this.dataTable.table().body()).parents('.dataTables_scrollBody');

                    var fixedColumnsDom = null;
                    if (dataTable.fixedColumns
                        && dataTable.fixedColumns().settings()
                        && dataTable.fixedColumns().settings()[0]._oFixedColumns) {
                        fixedColumnsDom = dataTable.fixedColumns().settings()[0]._oFixedColumns.dom;
                    }

                    if (this.select === 'multi') {
                        $('th.select-checkbox', header).on('click', function (e) {
                            headerTr.toggleClass('selected');
                            that.setAllRowSelected(headerTr.hasClass('selected'));
                            that.fire('selectall');
                        });
                    }
                    dataTable.on('select', function (e, dt, type, indexes) {
                        if (isAllRowSelected(that)) {
                            headerTr.addClass('selected');
                        }
                        var selectedIndex = dt.rows({selected: true}).indexes().toArray();
                        that.selectedIndex = selectedIndex;
                        that.fire('select', {selectedIndex: selectedIndex});
                    });
                    dataTable.on('deselect', function (e, dt, type, indexes) {
                        headerTr.removeClass('selected');
                        var selectedIndex = dt.rows({selected: true}).indexes().toArray();
                        that.selectedIndex = selectedIndex;
                        that.fire('select', {selectedIndex: selectedIndex});
                        that.adjustWidth();
                    });

                    dataTable.on('page', function (e, dt) {
                        var info = dataTable.page.info();
                        // 从0开始
                        that.fire('page', {
                            page: info.page,
                            start: info.start,
                            end: info.end,
                            pageSize: info.length,
                            total: info.recordsTotal,
                            pages: info.pages
                        });
                    });

                    if (fixedColumnsDom) {
                        $(fixedColumnsDom.header).on('click', 'th.sorting', {table: that}, headerClickHandler);
                    }
                    else {
                        $(header).on('click', 'th.sorting', {table: that}, headerClickHandler);
                    }

                    dataTable.on('click', 'td.details-control', function (e) {
                        var index = dataTable.row(this).index();
                        var eventArgs = {
                            index: index,
                            item: dataTable.row(index).data(),
                            dataTable: dataTable
                        };
                        var td = $(dataTable.cell(this).node());
                        td.removeClass('details-control').addClass('details-control-open');
                        td.html(that.minusIcon);
                        that.fire('subrowopen', eventArgs);
                    });

                    dataTable.on('click', 'td.details-control-open', function (e) {
                        var index = dataTable.row(this).index();
                        var eventArgs = {
                            index: index,
                            item: dataTable.row(index).data(),
                            dataTable: dataTable
                        };
                        var td = $(dataTable.cell(this).node());
                        td.removeClass('details-control-open').addClass('details-control');
                        td.html(that.plusIcon);
                        that.fire('subrowclose', eventArgs);
                        dataTable.row(index).child().hide();
                    });

                    scrollContainer.on('scroll', function (e) {
                        that.fire('scroll');
                        resetFixedHeadLeft(that, scrollContainer);
                    });

                    var delegate = Event.delegate;
                    delegate(
                        dataTable, 'startdrag',
                        this, 'startdrag',
                        {preserveData: true, syncState: true}
                    );
                    delegate(
                        dataTable, 'startdrag',
                        this, 'dragstart',
                        {preserveData: true, syncState: true}
                    );
                    delegate(
                        dataTable, 'enddrag',
                        this, 'dragend',
                        {preserveData: true, syncState: true}
                    );
                    delegate(
                        dataTable, 'enddrag',
                        this, 'enddrag',
                        {preserveData: true, syncState: true}
                    );
                    this.helper.addDOMEvent(window, 'resize', u.bind(function (e) {
                        this.adjustWidth();
                        this.fire('resize');
                    }, this));
                },

                /**
                 * 初始化DataTable
                 *
                 * @param {Dom} cNode 要渲染的dom节点
                 * @param {ui.DataTable} table table控件实例
                 * @param {Array} datasource 数据源
                 * @param {Array} fields field的配置
                 * @return {DataTable}
                 * @public
                 */
                initDataTable: function (cNode, table, datasource, fields) {
                    if (!table.autoWidth) {
                        $(table.main).addClass('fixed-table');
                    }
                    var options = {
                        dom: 'rtipl',
                        data: datasource,
                        info: false,
                        searching: false,
                        paging: table.clientPaging,
                        processing: true,
                        ordering: false,
                        scrollX: true,
                        scrollY: table.scrollY,
                        scrollBarVis: true,
                        scrollCollapse: true,
                        language: {
                            emptyTable: table.noDataHtml,
                            paginate: {
                                previous: table.pagePrevious,
                                next: table.pageNext
                            },
                            processing: table.processingText,
                            lengthMenu: table.lengthMenu
                        },
                        autoWidth: table.autoWidth,
                        columnDefs: getColumnDefs(table, fields)
                    };
                    options = u.extend(options, table.extendOptions, table.getDataTableExtendOptions());
                    return $(cNode).DataTable(options);
                },

                /**
                 * 设置subrow内容
                 *
                 * @param {string} content 内容
                 * @param {number} index 行数
                 * @public
                 */
                setSubrowContent: function (content, index) {
                    this.dataTable.row(index).child(content).show();
                },

                /**
                 * 获取某行数对应的subrow节点
                 *
                 * @param {number} index 行数
                 * @return {DOM}
                 * @public
                 */
                getSubrowContainer: function (index) {
                    return this.getChild('subrow-panel-' + index);
                },

                addRowBuilders: function () {},

                addHandlers: function () {},

                /**
                 * 重置body中的一些class
                 *
                 * @param {Array} fields field的配置
                 * @public
                 */
                resetBodyClass: function (fields) {
                    resetBodyClass(this, fields);
                },

                /**
                 * 重置select
                 *
                 * @public
                 * @param {boolean} select 是否select
                 */
                resetSelect: function (select) {
                    resetSelect(this, select);
                },

                /**
                 * 重置select的模式
                 *
                 * @public
                 * @param {string} selectMode select的模式
                 */
                resetSelectMode: function (selectMode) {
                    resetSelectMode(this, selectMode);
                },


                /**
                 * 重置排序
                 *
                 * @public
                 * @param {boolean} sortable 是否可排序
                 */
                resetSortable: function (sortable) {
                    resetSortable(this, sortable);
                },

                /**
                 * 重置排序规则
                 *
                 * @private
                 * @param {string} orderBy 排序的基准
                 * @param {string} order 升序或降序
                 */
                resetFieldOrderable: function (orderBy, order) {
                    resetFieldOrderable(this, orderBy, order);
                },

                /**
                 * 渲染自身
                 *
                 * @override
                 * @protected
                 */
                repaint: painters.createRepaint(
                    Control.prototype.repaint,
                    {
                        name: ['fields', 'datasource', 'foot'],
                        paint: function (table, fields, datasource, foot) {
                            if (table.dataTable) {
                                table.dataTable.destroy(true);
                            }
                            var isComplexHead = analysizeFields(fields).isComplexHead;
                            var headHTML = isComplexHead ? withComplexHeadHTML(table, fields)
                                            : simpleHeadHTML(table, fields);
                            var footHTML = createFooterHTML(table, foot);
                            var cNode = $.parseHTML('<table class="display dtr-inline" cellspacing="0" width="100%">'
                                        + headHTML + footHTML + '<tbody></tbody></table>');
                            $(cNode).appendTo(table.main);
                            var dataTable = table.initDataTable(cNode, table, datasource, fields);
                            table.dataTable = dataTable;
                            table.helper.initChildren(dataTable.table().header());
                            resetBodyClass(table, fields);
                            table.resetSortable(table.sortable);
                            table.resetSelectMode(table.selectMode);
                            table.resetSelect(table.select);
                            table.bindEvents();
                            table.adjustWidth();
                        }
                    },
                    {
                        name: 'selectMode',
                        paint: function (table, selectMode) {
                            table.resetSelectMode(selectMode);
                        }
                    },
                    {
                        name: 'sortable',
                        paint: function (table, sortable) {
                            table.resetSortable(sortable);
                        }
                    },
                    {
                        name: ['orderBy', 'order'],
                        paint: function (table, orderBy, order) {
                            table.resetFieldOrderable(orderBy, order);
                        }
                    },
                    {
                        // 一共四种格式
                        // 1. api: 只能通过api控制
                        // 2. multi
                        // 3. single
                        // 4. os: 可以shift/ctrl
                        name: 'select',
                        paint: function (table, select) {
                            table.resetSelect(select);
                        }
                    },
                    {
                        name: 'width',
                        paint: function (table, width) {
                            $(table.main).css('width', width);
                            table.adjustWidth();
                            table.fire('resize');
                        }
                    },
                    {
                        name: 'followHead',
                        paint: function (table, followHead) {
                            initFollowHead(table);
                            table.helper.removeDOMEvent(window, 'scroll', table.headReseter);
                            if (followHead) {
                                table.helper.addDOMEvent(window, 'scroll', table.headReseter);
                            }
                        }
                    }
                ),

                /**
                 * 设置fixed的header
                 *
                 * @public
                 */
                headReseter: function () {
                    if (!this.followHead) {
                        return;
                    }
                    var scrollTop = lib.page.getScrollTop();
                    var mainHeight = this.main.getBoundingClientRect().height;
                    var followTop = this.followTop;

                    // 如果不启用缓存，则需要每次滚动都做判断并获取了
                    if (this.noFollowHeadCache) {
                        resetFollowOffset(this);
                    }

                    if (scrollTop > followTop
                        && (scrollTop - followTop < mainHeight)) {
                        $(this.dataTable.table().header()).parent().css({
                            'position': 'fixed',
                            'top': this.followHeadOffset,
                            'z-index': this.zIndex + 1
                        });
                    }
                    else {
                        $(this.dataTable.table().header()).parent().css({
                            position: 'static'
                        });
                    }
                },

                /**
                 * 销毁释放控件
                 *
                 * @override
                 */
                dispose: function () {
                    var helper = this.helper;
                    if (helper.isInStage('DISPOSED')) {
                        return;
                    }
                    this.disposeChildren();

                    helper.beforeDispose();
                    this.dataTable.destroy(true);
                    this.dataTable = null;

                    helper.dispose();
                    helper.afterDispose();
                }
            }
        );

        /**
         * 重置fixed的表头的left值
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {jQuery.dom} node 容器的jquery对象
         */
        function resetFixedHeadLeft(table, node) {
            var tableScrollLeft = node[0].scrollLeft;
            var domHead = $(table.dataTable.table().header()).parent();
            var posStyle = domHead.css('position');
            if (posStyle === 'fixed') {
                var scrollLeft = lib.page.getScrollLeft();

                var curLeft = table.main.getBoundingClientRect().left - scrollLeft;
                domHead.css('left', curLeft - scrollLeft - tableScrollLeft);
            }
        }

        /**
         * 重置fixed的表头的left值
         *
         * @private
         * @param {Event} event header的点击事件
         */
        function headerClickHandler(event) {
            var table = event.data.table;
            var fieldId = $(this).attr('data-field-id');
            var actualFields = analysizeFields(table.fields).fields;
            var fieldConfig = u.find(actualFields, function (field) {
                return field.field === fieldId;
            });
            if (fieldConfig && fieldConfig.sortable) {
                var orderBy = table.orderBy;
                var order = table.order;

                if (orderBy === fieldConfig.field) {
                    order = (!order || order === 'asc') ? 'desc' : 'asc';
                }
                else {
                    order = 'desc';
                }

                table.setProperties({
                    order: order,
                    orderBy: fieldConfig.field
                });

                table.fire('sort', {field: fieldConfig, order: order});
            }
        }


        /**
         * 获取Datatable的column配置
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {Array} fields fields
         * @return {Array} columns
         */
        function getColumnDefs(table, fields) {
            var index = 0;
            var selectClass = table.helper.getPartClasses('selector-indicator');
            if (table.select === 'multi') {
                selectClass += ' ui-checkbox-custom';
            }
            else if (table.select === 'single') {
                selectClass += ' ui-radio-custom';
            }
            var columns = [{
                data: null,
                defaultContent: '<div class="' + selectClass + '">'
                                + '<label></label></div>',
                width: table.selectColumnWidth,
                targets: index++
            }];
            if (table.subEntry) {
                columns.push({
                    className: 'details-control',
                    orderable: false,
                    data: function (item) {
                        if (item.subrow) {
                            return table.plusIcon;
                        }
                        return null;
                    },
                    width: table.subEntryColumnWidth,
                    targets: index++
                });
            }
            if (table.treeGrid) {
                columns.push({
                    className: 'treegrid-control',
                    orderable: false,
                    data: function (item) {
                        if (item.children && item.children.length) {
                            return table.plusIcon;
                        }
                        return null;
                    },
                    width: table.treeGridColumnWidth,
                    targets: index++
                });
            }

            var actualFields = analysizeFields(fields).fields;
            u.each(actualFields, function (field) {
                var column = {
                    data: field.content,
                    targets: index++
                };
                if (field.width) {
                    column.width = field.width;
                }
                columns.push(column);
            });
            return columns;
        }

        /**
         * 初始化FollowHead
         *
         * @private
         * @param {ui.Table} table table控件实例
         */
        function initFollowHead(table) {
            if (table.followHead && !table.noFollowHeadCache) {
                resetFollowOffset(table);
            }
        }

        /**
         * 重置FollowDoms的offset
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         */
        function resetFollowOffset(table) {
            var followOffest = lib.getOffset(table.main);
            table.followTop = followOffest.top;
            table.followLeft = followOffest.left;
        }

        /**
         * 重置datable的body的className
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {Array} fields fields
         */
        function resetBodyClass(table, fields) {
            var columnDefs = table.dataTable.settings()[0].aoColumns;
            var actualFields = analysizeFields(table.fields).fields;
            u.each(columnDefs, function (def, index) {
                var fieldId = def.fieldId;
                var fieldConfig = u.find(actualFields, function (field) {
                    return field.field === fieldId;
                });
                if (fieldConfig) {
                    var alignClass = 'dt-body-' + (fieldConfig.align || 'left');
                    $(table.dataTable.column(index).nodes()).addClass(alignClass);
                }
            });
        }

        /**
         * 重置排序
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {boolean} sortable 是否可排序
         */
        function resetSortable(table, sortable) {
            var theads = $('th', table.dataTable.table().header());
            if (!sortable) {
                theads.removeClass('sorting sorting_asc sorting_desc');
                theads.find('i').remove();
                return;
            }
            var actualFields = analysizeFields(table.fields).fields;
            u.each(theads, function (head, index) {
                var fieldId = $(head).attr('data-field-id');
                var fieldConfig = u.find(actualFields, function (field) {
                    return field.field === fieldId;
                });
                if (fieldConfig && fieldConfig.sortable) {
                    $(head).find('i.ui-table-hsort').remove();
                    $(head).append('<i class="ui-table-hsort ui-icon"></i>');
                    $(head).addClass('sorting');
                }
                if (fieldConfig && !fieldConfig.sortable) {
                    $(head).find('i.ui-table-hsort').remove();
                }
            });
        }

        /**
         * 重置select
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {boolean} select 是否select
         */
        function resetSelect(table, select) {
            var dataTable = table.dataTable;
            dataTable.rows().deselect();

            var operationColumn = $(dataTable.column(0).nodes());
            var selectColumnClass = table.helper.getPartClasses('select-column');

            operationColumn.children(table.helper.getPartClasses('selector-indicator'))
                .removeClass('ui-checkbox-custom ui-radio-custom');
            $(dataTable.column(0).header()).removeClass('select-checkbox');
            $(dataTable.column(0).header()).find('.ui-checkbox-custom').remove();

            operationColumn.addClass(selectColumnClass + ' dt-body-center');

            if (!select) {
                select = 'api';
                dataTable.column(0).visible(false);
            }
            else {
                dataTable.column(0).visible(true);
                resetSelectMode(table, table.selectMode);
            }
            if (select === 'multi') {
                $(dataTable.column(0).header()).addClass('select-checkbox');
                $(dataTable.column(0).header()).append('<div class="ui-checkbox-custom"><label></label></div>');
                operationColumn.children(table.helper.getPartClasses('selector-indicator'))
                    .addClass('ui-checkbox-custom');
            }
            else if (select === 'single') {
                operationColumn.children(table.helper.getPartClasses('selector-indicator'))
                    .addClass('ui-radio-custom');
            }
            dataTable.select && dataTable.select.style(select);
        }

        /**
         * 重置selectMode
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {string} selectMode 选择器的type
         */
        function resetSelectMode(table, selectMode) {
            var dataTable = table.dataTable;
            if (selectMode === 'box') {
                var selector = 'td:first-child.' + table.helper.getPartClasses('select-column') + '>.'
                                + table.helper.getPartClasses('selector-indicator');
                table.dataTable.select.selector(selector);
            }
            else if (selectMode === 'line') {
                dataTable.select.selector('td');
            }
        }

        /**
         * 重置排序规则
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {string} orderBy 排序的基准
         * @param {string} order 升序或降序
         */
        function resetFieldOrderable(table, orderBy, order) {
            orderBy = orderBy || table.orderBy;
            var theads = $('th', table.dataTable.table().header());
            var actualFields = analysizeFields(table.fields).fields;
            u.each(theads, function (head, index) {
                $(head).removeClass('sorting_asc sorting_desc');
                var fieldId = $(head).attr('data-field-id');
                var fieldConfig = u.find(actualFields, function (field) {
                    return field.field === fieldId;
                });
                if (fieldId === orderBy && table.sortable && fieldConfig && fieldConfig.sortable) {
                    $(head).addClass('sorting sorting_' + order);
                }
            });
        }

        /**
         * 判断是够全选
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @return {boolean} 是否全选
         */
        function isAllRowSelected(table) {
            var rows = $(table.dataTable.body()).find('tr[role="row"]');
            var selectedIndexes = table.getSelectedIndexes();
            return selectedIndexes.length === rows.length;
        }

        /**
         * 从table的配置项中抽取实际上的配置
         *
         * @private
         * @param {Array} fields fields
         * @return {Object} config
         */
        function analysizeFields(fields) {
            var actualFields = [];
            var isComplexHead = false;
            u.each(fields, function (field) {
                if (!field.children) {
                    actualFields.push(field);
                }
                else {
                    isComplexHead = true;
                    actualFields = actualFields.concat(field.children);
                }
            });
            return {
                isComplexHead: isComplexHead,
                fields: actualFields
            };
        }

        /**
         * 获取头部的class
         *
         * @private
         * @param {Object} field field的配置
         * @return {string} class name
         */
        function getFieldHeaderClass(field) {
            return 'dt-head-' + (field.align || 'left');
        }

        /**
         * 构建head中th的text
         *
         * @private
         * @param {Object} field field的配置
         * @return {string} th内容
         */
        function createHeadTitle(field) {
            return field.tip ? '<div '
                    + 'data-ui="type:Tip;content:' + field.tip + '">'
                    + '</div>' + field.title : field.title;
        }

        /**
         * 构建带有复合表头head的html
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {Array} fields field的配置
         * @return {string} html
         */
        function withComplexHeadHTML(table, fields) {
            var HeadHTML = '<thead>';
            var html = ['<tr>'];
            var subHtml = ['<tr>'];
            var subEntry = table.subEntry;
            var treeGrid = table.treeGrid;
            html.push('<th rowspan="2" class="select-checkbox dt-head-center"></th>');
            if (subEntry) {
                html.push('<th rowspan="2" class="details-control"></th>');
            }
            if (treeGrid) {
                html.push('<th rowspan="2" class="treeGrid-control"></th>');
            }
            fields = fields || table.fields;
            u.each(fields, function (field) {
                if (!field.children) {
                    html.push('<th rowspan="2" class="' + getFieldHeaderClass(field)
                        + '" data-field-id="' + field.field + '">' + createHeadTitle(field) + '</th>');
                }
                else {
                    html.push('<th colspan="' + field.children.length + '">' + createHeadTitle(field) + '</th>');
                    u.each(field.children, function (child) {
                        subHtml.push('<th class="' + getFieldHeaderClass(child)
                            + '" data-field-id="' + child.field + '">' + createHeadTitle(child) + '</th>');
                    });
                }
            });
            html.push('</tr>');
            subHtml.push('</tr>');
            HeadHTML += html.join('');
            HeadHTML += subHtml.join('');
            HeadHTML += '</thead>';
            return HeadHTML;
        }

        /**
         * 构建正常head的html
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {Array} fields field的配置
         * @return {string} html
         */
        function simpleHeadHTML(table, fields) {
            var HeadHTML = '<thead>';
            var html = ['<tr>'];
            var subEntry = table.subEntry;
            var treeGrid = table.treeGrid;
            html.push('<th rowspan="1" class="select-checkbox dt-head-center"></th>');
            if (subEntry) {
                html.push('<th rowspan="1" class="details-control"></th>');
            }
            if (treeGrid) {
                html.push('<th rowspan="1" class="treegrid-control"></th>');
            }
            fields = fields || table.fields;
            u.each(fields, function (field) {
                html.push('<th rowspan="1" class="' + getFieldHeaderClass(field)
                        + '" data-field-id="' + field.field + '">' + createHeadTitle(field) + '</th>');
            });
            html.push('</tr>');
            HeadHTML += html.join('');
            HeadHTML += '</thead>';
            return HeadHTML;
        }

        /**
         * 构建footer的html
         *
         * @private
         * @param {ui.DataTable} table table控件实例
         * @param {Array} foot foot的配置
         * @return {string} html
         */
        function createFooterHTML(table, foot) {
            if (!foot || foot.length === 0) {
                return '';
            }

            var actualFields = analysizeFields(table.fields).fields;
            if (!(table.select === 'multi' || table.select === 'single')) {
                foot.unshift({});
            }
            foot = foot.slice(0, actualFields.length + 1);
            var lostLen = actualFields.length - foot.length;
            for (var i = 0; i <= lostLen; i++) {
                foot.push({});
            }
            var html = '<tfoot><tr>';
            var rows = [];
            var subEntry = table.subEntry;
            var treeGrid = table.treeGrid;
            if (subEntry) {
                rows.push('<th rowspan="1" class="details-control"></th>');
            }
            if (treeGrid) {
                rows.push('<th rowspan="1" class="treegrid-control"></th>');
            }
            u.each(foot, function (item) {
                var content = item.content || '';
                if (typeof item.content === 'function') {
                    content = item.content();
                }

                rows.push('<th class="' + 'dt-head-' + (item.align || 'left')
                            + '" colspan=' + (item.colspan || 1) + '>'
                            + content
                            + '</th>');
            });
            return html + rows.join('') + '</tr></tfoot>';
        }

        /**
         * 判断值是否为空
         *
         * @private
         * @param {Object} obj 要判断的值
         * @return {bool}
         */
        function hasValue(obj) {
            return obj != null;
        }

        /**
         * 判断值是否为空,包括空字符串
         *
         * @private
         * @param {Object} obj 要判断的值
         * @return {bool}
         */
        function isNullOrEmpty(obj) {
            return !hasValue(obj) || !obj.toString().length;
        }

        /**
         * 默认属性值
         *
         * @type {Object}
         * @public
         */
        DataTable.defaultProperties = {
            noDataHtml: '没有数据',
            followHead: false,
            followHeadOffset: 0,
            sortable: false,
            select: '',
            selectMode: 'box',
            subEntry: false,
            treeGrid: false,
            treeGridLeft: 12,
            autoWidth: true,
            selectColumnWidth: 35,
            subEntryColumnWidth: 5,
            treeGridColumnWidth: 5,
            plusIcon: '<span class="ui-icon-plus-circle ui-eicons-fw"></span>',
            minusIcon: '<span class="ui-icon-minus-circle ui-eicons-fw"></span>',
            clientPaging: false,
            processingText: '加载中...',
            pagePrevious: '上一页',
            pageNext: '下一页',
            scrollY: null,
            lengthMenu: '每页显示_MENU_',
            zIndex: 0
        };

        esui.register(DataTable);
        return DataTable;
    }
);
