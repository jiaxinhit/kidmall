/**
 * Create by dengmeng.dm
 * 在资源配置页面, 生产机器可拖拽和生成
 * 配合app-config.js
 * @param config
 * @returns {jQuery|HTMLElement}
 */

$.fn.pipeline = function (config) {
    //辅助方法
    var utils = {}, layer = {}, item = {};
    utils.calculatePosition = function (css1, css2, type) {
        if (type == "minus") {
            return {
                top: css1.top - css2.top,
                left: css1.left - css2.left
            };
        }

        if (type == "add") {
            return {
                top: css1.top + css2.top,
                left: css1.left + css2.left
            };
        }
    };

    utils.isExistWidget = function (el) {
        return (el.attr('id') && el.attr('id').indexOf('widget_') > -1);
    };

    utils.setDefaultValue = function (p, d) {
        p = (typeof(p) !== 'undefined') ? p : d;
        return p;
    };

    // widget属性按钮
    utils.addWidgetAttribute = function (widget) {
        widget.append($('<i class="widget-function info"></i>'));
        widget.find('.widget-function.info').click(function (e) {
            ac.showWidgetConfig(widget);
        });
    };

    // widget删除按钮
    utils.addWidgetDelete = function (widget) {
        widget.append($('<i class="widget-function delete"></i>'));
        widget.find('.widget-function.delete').click(function (e) {
            if($('#widget-attributes-area').is(':visible')&&widget.attr('id') == $('#J_widget_attributes_area_widget_id').attr('data-widget-id')){
                $('#widget-attributes-area').hide(100);
            };
            jsPlumb.remove(widget);
        });
    };

    utils.addConnection = function(widget){
        widget.append('<i class="widget-function connect"></i>');

        jsPlumb.makeSource(widget, {
            filter: ".connect",
            anchor: "Continuous",
            connector: ["StateMachine", { curviness: 1 }],
            connectionType:"default"
        });

        jsPlumb.makeTarget(widget, {
            dropOptions: { hoverClass: "dragHover" },
            anchor: "Continuous"
        });
    };

    //获取对象css的辅助方法
    utils.getStyles = function (element) {
        var style = element.style;
        var ret = {};
        for (var i = 0; i < style.length; ++i) {
            var item = style.item(i);
            ret[item] = style[item];
        }
        return ret;
    };

    utils.getElFromId = function(id){
        return id.replace(/_Continuous|_Left|_Right|_Top|_Bottom/,'');
    };

    //widget转换成JSON数据对象的方法
    utils.widgetConfig = function (el) {
        var wd = {
            title: $(el).attr('data-title'),
            id: $(el).attr('id'),
            type: $(el).attr('data-type'),
            css: utils.getStyles(el),
            data: $(el).data('data')
        };

        return wd;
    };

    //依赖jsPlumb
    var pl = jsPlumb,
        pipeline;
    var container = $(this);

    //参数初始化及传递
    var ac = $.extend({
        source: {
            widgets: [],
            connectors: []
        },
        widgetDelete: false,
        widgetAttribute: false,
        showWidgetConfig: function () {

        },
        addConnectionTypes:function(){

        },
        connectionRule: function (params) {
            return true;
        }
    }, config);

    pl.ready(function () {
        //导入默认配置
        pl.importDefaults({
            Endpoint: ["Dot", {radius: 4}],
            HoverPaintStyle: {strokeStyle: "#1e8151", lineWidth: 2 },
            DragOptions: {
                cursor: 'move',
                zIndex: 2000
            },
            ConnectionOverlays: [
                ["Arrow", {
                    location: 1,
                    width:10,
                    length:10
                }]
            ]
        });

        var instance = pl.getInstance({
            Container: container.attr('id')
        });

        layer.createDom = function (el, elToContainer) {
            var widget = $('<div class="widget"><div class="widget-title"></div><div class="widget-layer-content"></div></div>');
            widget.attr('id', el.id);
            widget.attr('data-title', el.title);
            widget.attr('data-type', el.type);
            widget.find('.widget-title').html(el.name);
            elToContainer.append(widget);
            widget.css(el.css).addClass('widget-layer');
            return widget;
        };

        layer.addEvents = function (widget) {
            widget.resizable({
                resize: function (event, ui) {
                    pl.repaintEverything();
                },
                handles: "all"
            }).droppable({
                hoverClass: "widget-layer-highlight",
                greedy: true,
                drop: function (event, ui) {
                    if (!(ui.helper.attr('id') && ui.helper.attr('id').indexOf('widget_') > -1)) {
                        var css1 = ui.helper.position('#pipeline-container');
                        var css2 = widget.position('#pipeline-container');
                        var config = {
                            title: ui.helper.attr('data-title'),
                            id: "widget_" + jsPlumbUtil.uuid(),
                            type: ui.helper.attr('data-widget-type'),
                            css: utils.calculatePosition(css1, css2, "minus")
                        };

                        instance.create_widget(config, widget.find('.widget-layer-content'));
                    } else {
                        // 当不在容器内
                        if (!(widget.find('#' + ui.helper.attr('id')).length > 0)) {
                            var css1 = ui.helper.position('#pipeline-container');
                            var css2 = widget.position('#pipeline-container');
                            widget.find('.widget-layer-content').append(ui.helper);
                            ui.helper.css(utils.calculatePosition(css1, css2, "minus"));
                        }
                    }

                    return false;
                }
            });
        }

        item.createDom = function (el, elToContainer) {
            var widget = $('<div class="widget widget-item"><div class="widget-img"></div><div class="widget-title"></div></div>');
            widget.attr('id', el.id);
            widget.attr('data-title', el.title);
            widget.attr('data-type', el.type);
            widget.find('.widget-title').html(el.name);
            elToContainer.append(widget);
            widget.addClass(el.title);

            widget.data('data', utils.setDefaultValue(el.data, {
                name: el.name,
                itemType: el.type,
                type: el.resType
            }));

            widget.css(el.css);
            return widget;
        };

        item.addEvents = function (widget) {

        };

        //容器拖入widget的事件
        container.droppable({
            drop: function (event, ui) {
                if (utils.isExistWidget(ui.helper)) {
                    //当widget存在
                    if (ui.helper.parents('.widget-layer-content').length > 0) {
                        //从layer中移出到container内
                        var css1 = ui.helper.position('#pipeline-container');
                        var css2 = ui.helper.closest('.widget-layer').position('#pipeline-container');
                        container.append(ui.helper);
                        ui.helper.css(utils.calculatePosition(css1, css2, "add"));
                    }
                } else {
                    //当widget不存在
                    var helper = $(ui.helper);
                    var config = {
                        title: helper.attr('data-title'),
                        id: "widget_" + jsPlumbUtil.uuid(),
                        type: helper.attr('data-widget-type'),
                        resType:helper.attr('data-type'),
                        css: helper.position('#pipeline-container')
                    };
                    instance.create_widget(config,undefined,function(widget){
                        ac.showWidgetConfig(widget);
                    });
                }
            }
        });

        jsPlumb.registerConnectionType("default",{
            paintStyle: {
                lineWidth: 2,
                dashstyle: "4 2",
                strokeStyle: "#61B7CF",
                joinStyle: "round",
                outlineColor: "white",
                outlineWidth: 2
            }
        });

        //创建widget对象
        function create_widget(el, elToContainer, callback) {
            elToContainer = utils.setDefaultValue(elToContainer, container);
            el.type = utils.setDefaultValue(el.type, '');

            if (el.data && el.data.name) {
                el.name = el.data.name;
            } else {
                el.name = el.title + Math.floor(Math.random()*1000);
            }

            el.css = utils.setDefaultValue(el.css, {});

            // 当是容器对象
            if (el.type == "layer") {
                var widget = layer.createDom(el, elToContainer);
                layer.addEvents(widget);
            } else {
                // item对象
                var widget = item.createDom(el, elToContainer);
                item.addEvents(widget);
            }

            if (ac.widgetDelete) {
                utils.addWidgetDelete(widget);
            }

            if (ac.widgetAttribute) {
                utils.addWidgetAttribute(widget);
            }

            utils.addConnection(widget);

            pl.draggable(widget, {
                revert: function (target) {
                    if (target.attr('data-type') == "layer" && $(this).attr('data-type') == "layer") {
                        $.toast({
                            text: 'Layer不支持多层',
                            type: 'danger',
                            position: 'top center'
                        });
                        return true;
                    }

                    return false;
                },
                grid: [1, 1],
                start: function (event, ui) {
                    container.addClass('widgetDragging');
                    $('._jsPlumb_endpoint,._jsPlumb_connector').addClass('nodisplay');
                },
                stop: function (event, ui) {
                    pl.repaintEverything();
                    container.removeClass('widgetDragging');
                    $('._jsPlumb_endpoint,._jsPlumb_connector').removeClass('nodisplay');
                }
            });

            if(typeof(callback)=="function"){
                callback(widget);
            }
        };

        //定义id格式
        function anchorJoin(el, type) {
            return el + '_' + type;
        };

        //初始化方法
        function init() {
            //根据JSON数据生成对应元素
            if (ac.source.widgets && ac.source.widgets.length > 0) {
                $.each(ac.source.widgets, function (index, el) {
                    create_widget(el);
                    if (el.children && el.children.length > 0) {
                        $.each(el.children, function (cindex, cel) {
                            create_widget(cel, $('#' + el.id).find('.widget-layer-content'));
                        });
                    }
                });
            }

            ac.addConnectionTypes();

            //根据JSON生成对应连接线
            if (ac.source.connectors && ac.source.connectors.length > 0) {
                $.each(ac.source.connectors, function (index, el) {
                    el.type = utils.setDefaultValue(el.type,'default');
                    var connect = pl.connect({
                        source: utils.getElFromId(el.from),
                        target: utils.getElFromId(el.to),
                        editable: true
                    });
                    connect.clearTypes();
                    connect.addType(el.type);
                });
            }

            jsPlumb.bind("beforeDrop", function (params) {
                return ac.connectionRule(params);
            });
        };
        init();

        instance.create_widget = create_widget;
        instance.activeConfig = ac;
        instance.getCurrentStatusJSON = function () {
            var config = {
                source: {}
            }
            var w = [],
                c = [];

            $.each(container.children('.widget'), function (index, el) {
                var wd = utils.widgetConfig(el);

                if ($(el).find('.widget').length > 0) {
                    var children = [];
                    $.each($(el).find('.widget'), function (cindex, cel) {
                        var cwd = utils.widgetConfig(cel);
                        children.push(cwd);
                    });

                    wd.children = children;
                }

                w.push(wd);
            });

            $.each(pl.getAllConnections(), function (index, co) {
                var cd = {};
                $.each(co.endpoints, function (ei, cel) {
                    var str = anchorJoin(cel.elementId, cel.anchor.type);
                    if (co.sourceId != co.targetId) {
                        if (cel.elementId == co.sourceId) {
                            cd.from = str;
                        }

                        if (cel.elementId == co.targetId) {
                            cd.to = str;
                        }
                    } else {
                        if (cel.isSource) {
                            cd.from = str;
                        } else {
                            cd.to = str;
                        }
                    }
                });

                var type = co.getType();
                if(type.length > 0){
                    cd.type = type[0]
                }else{
                    cd.type = "default";
                }


                if (co.getLabel() && co.getLabel().length > 0) {
                    cd.alabel = co.getLabel();
                }

                c.push(cd);
            });

            config.source.widgets = w;
            config.source.connectors = c;

            return config;
        };

        container.data('instance', instance);
    });

    return container;
};