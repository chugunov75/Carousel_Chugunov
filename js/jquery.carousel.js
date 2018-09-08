(function($){
	$.fn.carousel=function(options){
/*
---horisontal - gfhf
*/
		options=$.extend({
			horisontal: true,
			slideWidth: 300,
			imagesPerFrame: 3,
			shiftIncrement: 2,
			slideDuration: 500,
			autoscrolling: false,
			autoscrollingSpeed: 3000,
			cyclic: true,
		},options);

		function setCarousel(container){

			container.css({
				'position':'relative',
				'overflow': 'hidden',
			});
			var source=$(container).children('ul').css({
				'position':'absolute',
				'left':'-9999px',
			});

			source.css({
				'display':'block',
			});

			container.children(':not(ul)').remove();

			var items=$('.carousel-item',source);
			if(items.length==0){
				throw new Error('Для прокрутки слайдов нужны слайды');
			}

			var maxSlideWidth=0;
			
			items.each(function(i,elem){
				var current=$(elem);				
				if(current.outerWidth(true)>maxSlideWidth){
					maxSlideWidth=current.outerWidth(true);
				}
				
			});

			var slideWidth=0;
			var slideHeight=0;
			var imagesPerFrame=0;
/*-----------подгонка ширины/высоты слайда, подбор количества слайдов на экране*/
			
			if(!options.slideWidth){
				
				options.slideWidth=maxSlideWidth;
			}
			options.imagesPerFrame=(options.imagesPerFrame>0)?(options.imagesPerFrame): 1;

			slideWidth=(container.width()>=options.slideWidth)? (options.slideWidth) : container.width();

			imagesPerFrame=(options.horisontal)?(Math.floor(container.width()/slideWidth)): options.imagesPerFrame;

			items.css({
				'width': slideWidth+'px',
			});
			
			items.each(function(i,elem){
				var current=$(elem);
				
				if(current.outerHeight(true)>slideHeight){
					slideHeight=current.outerHeight(true);
				}
			});

			if(!options.horisontal){
				
				container.css({'display': 'table'});
			}
/*-----------------при прокрутке без циклизации количество слайдов на экране должно быть меньше общего числа слайдов, иначе генерируется ошибка*/
			if(!options.cyclic){
				if(imagesPerFrame>=items.length && items.length>=2){
					imagesPerFrame=items.length-1;
				}
				else if(items.length==1){
					throw new Error('Для прокрутки без циклизации количество слайдов должно быть больше 1');
				}
			}
			
			var shiftIncrement=(options.shiftIncrement>imagesPerFrame)? (imagesPerFrame) : options.shiftIncrement;
/*-------slides - массив для хранения слайдов*/
			var slides=[];
			var slidesCount=(options.cyclic)?(imagesPerFrame + shiftIncrement*2) : (items.length);
			var counter=0;
			var max=items.length;
			var shift=(options.horisontal)? (shiftIncrement*slideWidth) : (shiftIncrement*slideHeight);

			var setRibbonParam=null;
			var moveNextRibbonParam=null;
			var movePrevRibbonParam=null;

			var scroll=false;
			

			var frame=$('<div></div>');
			var ribbon=$('<div></div>').appendTo(frame).css({
				'overflow':'hidden',
				'position':'relative',
			});

			frame.css({
				'overflow':'hidden',
				'margin': '0 auto',
				'position':'relative',
			});

			for(var i=0; i<slidesCount; i++){
				var slide=$('<div></div>').appendTo(ribbon).width(slideWidth).
				css({
					'float':'left',
				});

				slide.height(slideHeight);
				
				if(!options.cyclic){
					slide.append(items.eq(i).clone().attr('title','слайд '+(i+1)+' из '+max));
				}
				slides.push(slide);
			}

			var arrowNext=$('<div class="btn-arrow"></div>').appendTo(container);
			var arrowPrev=$('<div class="btn-arrow"></div>').appendTo(container);
			

			if(options.horisontal){

				frame.width(slideWidth*imagesPerFrame);
				ribbon.width(slideWidth*slidesCount);

				if(options.cyclic){
					setRibbonParam={'left':-shift+'px'}
					moveNextRibbonParam={'left':(-shift*2)+'px'};
					movePrevRibbonParam={'left':0+'px'};
				}
				
				arrowPrev.addClass('btn-arrow-left');
				arrowNext.addClass('btn-arrow-right');
			}
			else{
				frame.height(slideHeight*imagesPerFrame);
				frame.width(slideWidth);
				ribbon.width(slideWidth);
				arrowPrev.addClass('btn-arrow-up');
				arrowNext.addClass('btn-arrow-down');

				container.css({'padding-top':(arrowPrev.height()+2)+'px',
					'padding-bottom':(arrowPrev.height()+2)+'px',
				});

				if(options.cyclic){
					setRibbonParam={'top':-shift+'px'}
					moveNextRibbonParam={'top':(-shift*2)+'px'};
					movePrevRibbonParam={'top':0+'px'};
				}
			}

			if(options.cyclic){

				arrowPrev.on('click',prevArrowClickHandler);
				arrowNext.on('click',nextArrowClickHandler);
				container.on('mouseenter',function(e){
					scroll=false;
				});
				container.on('mouseleave',function(e){
					scroll=true;
				});

				fillRibbon(0,slides.length-1);

				ribbon.children().children().css('width',slideWidth+'px');

				ribbon.css(setRibbonParam);
			}
			else{
				arrowPrev.on('click',prevArrowClickHandlerWithoutCycle);
				arrowNext.on('click',nextArrowClickHandlerWithoutCycle);
			}
			

			container.append(frame);
/*-------------уточнение параметров и запуск автоматической прокрутки*/
			if(options.cyclic && options.autoscrolling){
				scroll=true;
				options.autoscrollingSpeed=(options.autoscrollingSpeed<options.slideDuration*2)?(options.slideDuration*2): options.autoscrollingSpeed;
				moveRibbonAutomatically();
			}
/*------------fillRibbon - функция, обеспечивающая заполнение слайдера соответствующими слайдами при циклической прокрутке; 
в качестве аргументов принимает начальный и конечный индексы  диапазона слайдов, подлежащих заполнению*/
			function fillRibbon(startIndex, endIndex){

				for(var i=startIndex; i<=endIndex; i++){
					var index=counter+i-shiftIncrement;
					if(index < 0){
						do{
							index=max+index;
						}while(index < 0);
					}else if(index>max-1){
						do{
							index=index-max;
						}while(index>max-1);
					}
					if((i==shiftIncrement-1 && index==max-1) || (i==slides.length-shiftIncrement  && index==imagesPerFrame)){
						counter=0;
					}
					var item=items.eq(index).clone();
					var itemTitle='слайд '+(index+1)+' из '+max;
					item.attr('title',itemTitle);
					$(slides[i]).empty().append(item);
				}
			}
/*---------nextArrowClickHandler и prevArrowClickHandler обработчики прокрутки карусели с зацикливанием*/			
			function nextArrowClickHandler(e){
				var btn=$(e.currentTarget);
				if(!btn.hasClass('disabled')){
					
					btn.addClass('disabled');

					counter=counter+shiftIncrement;

					ribbon.stop().animate(moveNextRibbonParam,{
						duration: options.slideDuration,
						complete: function(){
							for(var i=0; i<slides.length-shiftIncrement;i++){ 
								slides[i].empty().append(slides[i+shiftIncrement].children().first());
							}
							fillRibbon(slides.length-shiftIncrement, slides.length-1);
							$(this).css(setRibbonParam);
							btn.removeClass('disabled');						
						},
					});
				}
				
			}

			function prevArrowClickHandler(e){
				var btn=$(e.currentTarget);
				if(!btn.hasClass('disabled')){
					btn.addClass('disabled');
					counter=counter-shiftIncrement;
					ribbon.stop().animate(movePrevRibbonParam,{
						duration: options.slideDuration,
						complete: function(){
							for(var i=slides.length-1; i>=shiftIncrement;i--){ 
								slides[i].empty().append(slides[i-shiftIncrement].children().first());
							}
							fillRibbon(0, shiftIncrement-1);
							$(this).css(setRibbonParam);
							btn.removeClass('disabled');						
						},
					});

				}
			}
/*---------nextArrowClickHandlerWithoutCycle и prevArrowClickHandlerWithoutCycle обработчики прокрутки карусели без зацикливания*/

			var newPropValue={};
			var propName=(options.horisontal)? 'left':'top';
			/*step - минимальное перемещение при прокрутке*/
			var step=(options.horisontal)? slideWidth:slideHeight;

			function nextArrowClickHandlerWithoutCycle(e){
				var btn=$(e.currentTarget);
				if(!btn.hasClass('disabled')){
					btn.addClass('disabled');
					if(counter<max-imagesPerFrame){
						counter=(counter+shiftIncrement<=max-imagesPerFrame)?(counter+shiftIncrement):(max-imagesPerFrame);							
					}
					else{
						counter=0;
					}
					newPropValue[propName]=(-counter*step)+'px';
					ribbon.animate(newPropValue,{
						duration: options.slideDuration,
						complete: function(){btn.removeClass('disabled');},
					});
				}
			}

			function prevArrowClickHandlerWithoutCycle(e){
				var btn=$(e.currentTarget);
				if(!btn.hasClass('disabled')){
					btn.addClass('disabled');
					if(counter>0){
						counter=(counter-shiftIncrement>=0)?(counter-shiftIncrement):(0);					
					}
					else{
						counter=max-imagesPerFrame;
					}
					newPropValue[propName]=(-counter*step)+'px';
					ribbon.animate(newPropValue,{
						duration: options.slideDuration,
						complete: function(){btn.removeClass('disabled');},
					});
				}				
			}
	/*----------moveRibbonAutomatically - функция, прокручивающая карусель в автоматическом режиме*/		
			function moveRibbonAutomatically(){
				var startTime=performance.now();
				requestAnimationFrame(function tick(time){
					if(!scroll){
						startTime=time;
					}
					if((time-startTime)/options.autoscrollingSpeed >=1){
						arrowNext.trigger('click');
						startTime=time;
					}
					requestAnimationFrame(tick);
				});
			}
		}

		function make(index,element){
			var elem=$(this);
			setCarousel(elem);
			$(window).on('resize',function(e){
				setCarousel(elem);
			});
		}

		var result=null;
		try{
			result=this.each(make);
		}
		catch(error){
			alert(error.message);
		}

		return result;
	}
})(jQuery);