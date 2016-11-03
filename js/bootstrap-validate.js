/***
 * 基于bootstrap及jquery开发的检查工具
 * 使用示例
 //调用init方法
 $('div').tooltip();

 //调用init方法
 $('div').tooltip({
    foo: 'bar'
});

 // 调用hide方法
 $('div').tooltip('hide');

 //调用Update方法
 $('div').tooltip('update', 'This is the new tooltip content!');
 */
(function ($) {
	var methods = {
		init: function (options) {
			// this
			//默认值
			this.defaults= {
				messageStyle:"color:red;padding-left:3px;padding-right:3px;width:auto;",
				shortTest:true,	//短路校验
				autoTest:true,	//自动校验(onblur校验)
			};
			this.settings= $.extend({},this.defaults, options);
		}
	};

	$.fn.bsValidate = function (method) {
		// 方法调用
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		} else if (typeof method === 'object' || !method) {
			return methods.init.apply(this, arguments);
		} else {
			$.error('方法' + method + '在插件中不存在');
		}
	};
})(jQuery);