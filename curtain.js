/*
* Curtain.js - Create an unique page transitioning system
* ---
* Version: 1.1
* Copyright 2011, Victor Coulon (http://victorcoulon.fr)
* Released under the MIT Licence
*/

(function ( $, window, document, undefined ) {

    var pluginName = 'curtain',
        defaults = {
            scrollSpeed: 400,
            bodyHeight: 0,
            linksArray: [],
            mobile: false,
            scrollButtons: {},
            menu: null
        };

    // The actual plugin constructor
    function Plugin( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;

        this.didScroll = false;

        this._defaults = defaults;
        this._name = pluginName;

        this.init();
    }

    Plugin.prototype = {
        init: function () {
            var self = this;

            // Cache element
            this.$element = $(this.element);
            this.$li = $(this.element).find('>li');

            $.MobileDevice = ((navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i)) || (navigator.userAgent.match(/Android/i)));
            $.Tablet = ((navigator.userAgent.match(/iPad/i)));

            if($.Tablet || $.MobileDevice){
                this.options.mobile = true;
                this.$li.css({position:'relative'});
                this.$element.find('.fixed').css({position:'absolute'});
            }

            if(self.options.menu){
                self.options.scrollButtons['up'] =  self.options.menu.find('[href="#up"]');
                self.options.scrollButtons['down'] =  self.options.menu.find('[href="#down"]');
                if(self.options.mobile){
                    self.$element.css({
                        position:'fixed',
                        top:0,
                        left:0,
                        right:0,
                        bottom:0,
                        '-webkit-overflow-scrolling':'touch',
                        overflow:'auto'
                    });
                    self.options.menu.css({position:'absolute'});
                }
            }

            // When all image is loaded
            $(window).load(function(){
                self.setDimensions();
                self.$li.eq(0).addClass('current');

                if(!self.options.mobile){
                    if(self.$li.eq(1).length)
                        self.$li.eq(1).nextAll().css({display:'none'});
                }

                self.setEvents();
                self.setLinks();
                self.isHashIsOnList(location.hash.substring(1));
            });
        },
        // Events
        scrollToPosition: function (direction){
            var position = null,
                self = this,
                scrollEl = (this.options.mobile) ? this.$element : $('body, html');

            if($('html, body').is(':animated')){
                return false;
            }

            if(direction === 'up' || direction == 'down'){
                // Keyboard event
                var $current = this.$element.find('.current'),
                    $next = (direction === 'up') ? $current.prev() : $current.next();

                position = $next.attr('data-position') || null;

                
                // Step in the current panel ?
                if($current.find('.step').length){
                    if(!$current.find('.current-step').length)
                        $current.find('.step').eq(0).addClass('current-step');
                    var $nextStep = (direction === 'up') ? $current.find('.current-step').prev('.step') : $current.find('.current-step').next('.step');
                    if($nextStep.length) {
                        position = (this.options.mobile) ? $nextStep.position().top + parseInt($current.attr('data-position'), 10) : $nextStep.offset().top;
                    }
                }

                if(position){
                    scrollEl.animate({
                        scrollTop:position
                    }, this.options.scrollSpeed);
                }

            } else{
                position = $("#"+direction).attr('data-position') || null;
                if(position){
                    scrollEl.animate({
                        scrollTop:position
                    }, this.options.scrollSpeed).scrollTop(position);
                }
            }
            
        },
        scrollEvent: function() {
            var self = this;

            setInterval(function() {
                if ( self.didScroll ) {
                    self.didScroll = false;
                
                    var docTop = $(document).scrollTop(),
                        $current = self.$element.find('.current'),
                        $fixed = $current.find('.fixed'),
                        $step = $current.find('.step'),
                        currentP = parseInt($current.attr('data-position'), 10),
                        currentHeight = parseInt($current.attr('data-height'), 10),
                        windowHeight = $(window).height();

                    if(docTop < currentP && $current.index() > 0){
                        // Scroll top
                        $current.removeClass('current').css({marginTop: 0})
                            .nextAll().css({display:'none'}).end()
                            .prev().addClass('current').css({display:'block'});

                    } else if(docTop < (currentP + $current.height())){
                        // Animate the current pannel during the scroll
                        $current.css({marginTop:-(docTop-currentP)});

                        // If there is a fixed element in the current panel
                        if($fixed.length){
                            var dataTop = parseInt($fixed.attr('data-top'), 10);
                            if((docTop-currentP+windowHeight) >= currentHeight && $fixed.css('position') === 'fixed'){
                                $fixed.css({
                                    position: 'absolute',
                                    top: Math.abs(docTop-currentP + dataTop)
                                });

                            } else if((docTop-currentP+windowHeight) <= currentHeight && $fixed.css('position') === 'absolute'){
                                $fixed.css({
                                    position: 'fixed',
                                    top: dataTop
                                });
                            }
                        }

                        
                        // If there is a step element in the current panel
                        if($step.length){
                            $.each($step, function(i,el){
                                if($(el).offset().top <= docTop+5 && ($(el).offset().top + $(el).outerHeight()) >= docTop+5){
                                    if(!$(el).hasClass('current-step')){
                                        $step.removeClass('current-step');
                                        $(el).addClass('current-step');
                                    }
                                }
                            });
                        }

                    } else {
                        // Scroll bottom
                        $current.removeClass('current')
                            .css({display:'none'})
                            .next().addClass('current').nextAll().css({display:'block'});
                    }
                }
            }, 5);

        },
        scrollMobileEvent: function() {
            var self = this;

            setInterval(function() {
                if ( self.didScroll ) {
                    self.didScroll = false;
                
                    var docTop = self.$element.scrollTop(),
                        $current = self.$element.find('.current'),
                        $step = $current.find('.step'),
                        currentP = parseInt($current.attr('data-position'), 10),
                        currentHeight = parseInt($current.attr('data-height'), 10),
                        windowHeight = $(window).height();

                    if(docTop+10 < currentP && $current.index() > 0){
                        $current.removeClass('current').prev().addClass('current');
                    } else if(docTop+10 < (currentP + $current.height())){
    
                        // If there is a step element in the current panel
                        if($step.length){
                            $.each($step, function(i,el){
                                if(($(el).position().top+currentP) <= docTop && (($(el).position().top+currentP) + $(el).outerHeight()) >= docTop){
                                    if(!$(el).hasClass('current-step')){
                                        $step.removeClass('current-step');
                                        $(el).addClass('current-step');
                                    }
                                }
                            });
                        }

                    } else {
                        $current.removeClass('current').next().addClass('current');
                    }
                }
            }, 5);

        },
        // Setters
        setDimensions: function(){
            var windowHeight = $(window).height(),
                levelHeight = 0,
                cover = false,
                height = null;

            this.$li.each(function(index) {
                var $self = $(this);
                cover = $self.hasClass('cover');

                if(cover){
                    $self.css({height: windowHeight, zIndex: 999-index})
                        .attr('data-height',windowHeight)
                        .attr('data-position',levelHeight);
                    levelHeight += windowHeight;
                } else{
                    height = ($self.outerHeight() <= windowHeight) ? windowHeight : $self.outerHeight();
                    $self.css({minHeight: height, zIndex: 999-index})
                        .attr('data-height',height)
                        .attr('data-position',levelHeight);
                    levelHeight += height;
                }

                if($self.find('.fixed').length){
                    var top = $self.find('.fixed').css('top');
                    $self.find('.fixed').attr('data-top', top);
                }
            });
            if(!this.options.mobile)
                this.setBodyHeight();
        },
        setEvents: function() {
            var self = this;

            $(window).on('resize', function(){
                self.setDimensions();
            });

            if(self.options.mobile) {
                self.$element.on('scroll', function(){
                    self.didScroll = true;
                    self.scrollMobileEvent();
                });
            } else {
                $(window).on('scroll', function(){
                    self.didScroll = true;
                    self.scrollEvent();
                });
            }

            $(document).on('keydown', function(e){
                if(e.keyCode === 38 || e.keyCode === 37) {
                    self.scrollToPosition('up');
                    e.preventDefault();
                    return false;
                }
                if(e.keyCode === 40 || e.keyCode === 39){
                    self.scrollToPosition('down');
                    e.preventDefault();
                    return false;
                }
            });

            if(self.options.scrollButtons){
                if(self.options.scrollButtons.up){
                    self.options.scrollButtons.up.on('click', function(e){
                        e.preventDefault();
                        self.scrollToPosition('up');
                    });
                }
                if(self.options.scrollButtons.down){
                    self.options.scrollButtons.down.on('click', function(e){
                        e.preventDefault();
                        self.scrollToPosition('down');
                    });
                }
            }

            if ("onhashchange" in window) {
                window.addEventListener("hashchange", function(){
                    self.isHashIsOnList(location.hash.substring(1));
                }, false);
            }
        },
        setBodyHeight: function(){
            var h = 0;
            this.$li.each(function() {
               h += $(this).height();
            });
            this.options.bodyHeight = h;
            $('body').height(h);
        },
        setLinks: function(){
            var self = this;
            this.$li.each(function() {
                var id = $(this).attr('id') || 0;
                self.options.linksArray.push(id);
            });
        },
        setHash: function(hash){
            window.location.hash = hash;
        },
        // Utils
        isHashIsOnList: function(hash){
            var self = this;
            $.each(self.options.linksArray, function(i,val){
                if(val === hash){
                    self.scrollToPosition(hash);
                    return false;
                }
            });
        }
    };



    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, 'plugin_' + pluginName)) {
                $.data(this, 'plugin_' + pluginName, new Plugin( this, options ));
            }
        });
    };


})( jQuery, window, document );
