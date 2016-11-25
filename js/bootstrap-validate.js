/**
 * @author woodens
 *
 * 前端输入检验
 *
 * 一、说明
 * 1. 功能
 * （1）校验一组html控件内容的合法性，该组控件可以属于一个form也可以在<div>或其他html元素中；
 * （2）支持自动校验与手动校验；
 * （3）自动校验支持动态事件绑定；
 * （4）支持手机端控件；
 * （5）支持对控件组校验（例如，一组checkbox或ratiobox）;
 * （6）支持用户自定义校验器。
 * 2. html属性
 * （1）test-id：被校验控件或控件组的校验id；
 * （2）message-for：校验信息隶属于哪个被校验控件，基值为被校验控件的test-id；
 * （3）test-type：校验信息的类型，与message-for同时使用；
 * （4）test-point：待校验控件组中的校验点，即组中的单个控件；
 * （5）required, groupRequired, number, max, min, minlength, email, idcard, mobile，equalTo以及自定义校验器的名字，用于标识待校验控件的校验类型；
 * 3. 使用方法
 * （1）html代码
 * 		<div id="inputs_elements">
 * 			<div>
 * 				<input type="text" test-id="element1" required/>
 * 				<span message-for="element1">不能为空</span>
 * 			</div>
 * 			<div>
 * 				<input type="text" test-id="element2" required number max="100" min="50"/>
 * 				<!--非空的大于等50小于等于100的数字-->
 * 				<span message-for="element2" test-type="required">不能为空</span>
 * 				<span message-for="element2" test-type="number">必须输入数字</span>
 * 				<span message-for="element2" test-type="max">最大值为100</span>
 * 				<span message-for="element2" test-type="min">最小值为50</span>
 * 			</div>
 * 			<div>
 * 				<div test-id="group1" groupRequired>  <!-- 一组checkbox必须选择至少一个 -->
 * 					<input type="checkbox" test-point>
 * 					<input type="checkbox" test-point>
 * 					<input type="checkbox" test-point>
 * 				</div>
 * 				<span message-for="group1" test-type="groupRequired">必须选择至少一个</span>
 * 			</div>
 * 		    <div>                                   <!-- 一组值不能重复 -->
 * 		        <input type="text" test-id="value1" distinct="value">
 * 		        <span message-for="value1" test-type="distinct">数值重复</span>
 * 		        <input type="text" test-id="value2" distinct="value">
 * 		        <span message-for="value2" test-type="distinct">数值重复</span>
 * 		        <input type="text" test-id="value3" distinct="value">
 * 		        <span message-for="value3" test-type="distinct">数值重复</span>
 * 		    </div>
 * 		</div>
 * （2）JS代码
 * 		a.创建校验对象
 * 			var validate1 = $("#inputs_elements").SimValidate({  //**** 该函数参数可选
 *							autoTest:true,	//是否自动校验(onblur事件)，默认为true
 *							shortTest:true,	//是否短路校验，默认为true
 * 							messageStyle:"color:red;padding-left:3px;padding-right:3px",//显示消息的样式，些处为默认值
 * 						});
 * 		b. 自定义校验器
 * 			注意：校验器名必须为合法js标识符（不能包括中划线）
 * 			validate1.extend({
 * 				validator_name : function(value, param, $element, obj){
 * 					//value: 待校验对象的输入值;
 * 					//param: 校验类型的取值（如 max="20" 中的值 20）;
 * 					//$element: 待校验对象的Jquery对象;
 * 					//obj: 当前的SimValidate对象.
 * 					...
 * 					return true; // or false
 * 				}
 * 			})
 * 		c. 手动校验
 * 			var result = validate1.validate(); 当所有元素检验都通过时，返回true，否则返回false
 */

;(function($, window, document, undefined){
	/**
	 * 返回校验对象
	 * @param {Object} options
	 */
	$.fn.SimValidate=function(options){
		var simVali=new SimValidate(this,options);
		simObject=simVali;
		return simVali;
	};

	/**
	 * 构造函数
	 * @param {Object} eles 被选择元素
	 * @param {Object} options 设置
	 */
	var SimValidate = function(eles, options){
		if(eles==null || eles == undefined){
			alert("没有设定校验元素!");
			return;
		}
		this.$eles=eles;
		this.eles_path=this.getPath(eles);
		//默认值
		this.defaults= {
			shortTest:true,	//短路校验
			autoTest:true	//自动校验(onblur校验)
		};
		this.settings= $.extend({},this.defaults, options);
		eles.find("[message-for]").addClass('sr-only');//隐藏所有消息
		eles.find("[message-for]").closest('.form-group').removeClass('has-error');//取消错误样式
		if(this.settings['autoTest']){
			this.autoValidate();
		}
		this.delDepend();
	};

	SimValidate.prototype={
		/**
		 * 自动校验
		 */
		autoValidate: function(){
			var validators = this.validators;
			var $eles = this.$eles;
			var eles_path = this.eles_path;
			var settings=this.settings;
			var simValidate = this;

			//校验每个待校验元素
			$eles.find("[test-id]").each(function(index){
				var test_id=$(this).attr("test-id");
				var $element = $(this);

				if($element.find("[test-point]").size()==0) {
					$(eles_path).on("focus", "[test-id='" + test_id + "']", function () {
						$eles.find("[message-for='" + test_id + "']").addClass('sr-only');
						$eles.find("[message-for='" + test_id + "']").closest('.form-group').removeClass('has-error');
					});
					$(eles_path).on("keyup", "[test-id='" + test_id + "']", function () {
						simValidate.testElement($element, test_id);
					});
					$(eles_path).on("blur", "[test-id='" + test_id + "']", function () {
						simValidate.testElement($element, test_id);
					});
					$(eles_path).on("change", "[test-id='" + test_id + "']", function () {
						simValidate.testElement($element, test_id);
					});
				}else{ // 如果是 group test
					$(eles_path).on("focus","[test-id='"+test_id+"'] [test-point]",function(){
						$eles.find("[message-for='"+test_id+"']").addClass('sr-only');
						$eles.find("[message-for='"+test_id+"']").closest('.form-group').removeClass('has-error');
					});
					$(eles_path).on("keyup","[test-id='"+test_id+"'] [test-point]",function(){
						$eles.find("[message-for='"+test_id+"']").addClass('sr-only');
						$eles.find("[message-for='"+test_id+"']").closest('.form-group').removeClass('has-error');
						simValidate.testElement($element);
					});
					$(eles_path).on("blur","[test-id='"+test_id+"'] [test-point]",function(){
						$eles.find("[message-for='"+test_id+"']").addClass('sr-only');
						$eles.find("[message-for='"+test_id+"']").closest('.form-group').removeClass('has-error');
						simValidate.testElement($element);
					});
					$(eles_path).on("change","[test-id='"+test_id+"'] [test-point]",function(){
						$eles.find("[message-for='"+test_id+"']").addClass('sr-only');
						$eles.find("[message-for='"+test_id+"']").closest('.form-group').removeClass('has-error');
						simValidate.testElement($element);
					});
					$(eles_path).on("click","[test-id='"+test_id+"'] [test-point]",function(){
						$eles.find("[message-for='"+test_id+"']").addClass('sr-only');
						$eles.find("[message-for='"+test_id+"']").closest('.form-group').removeClass('has-error');
						simValidate.testElement($element,test_id);
					});
				}
			});

		},

		/**
		 * 手动校验
		 */
		validate: function(){
			this.$eles.find("[message-for]").addClass('sr-only');
			this.$eles.find("[message-for]").closest('.form-group').removeClass('has-error');
			var total_valid = true;
			var simValidate = this;
			//校验每个待校验元素
			this.$eles.find("[test-id]").each(function(index){
				total_valid &= simValidate.testElement($(this));
			});

			return total_valid;
		},
		/**
		 * 校验每一个待校验元素
		 */
		testElement: function($point){
			var validators = this.validators;
			var $eles = this.$eles;
			var settings=this.settings;

			var single_valid=true;

			for(var key in validators){//每个校验器
				if(settings["shortTest"] && !single_valid) break;//如果短路校验

				var param = $point.attr(key);
				if(param==null) continue;//如果不需当前校验器

				var validator=validators[key];
				var value = $point.val();
				var test_id=$point.attr("test-id");

				if($point.data('depend') && !$eles.find('[test-depend="'+$point.data('depend')+'"]').is(':checked')){
					continue;
				}
				if(!validator(value,param,$point,this)){//注入校验器参数：value值，param校验参数，$point待校验对象，this当前SimValidate对象
					if($eles.find("[message-for='"+test_id+"']").size() > 1) {
						$eles.find("[message-for='" + test_id + "'][test-type='" + key + "']").siblings().addClass('sr-only');
						$eles.find("[message-for='" + test_id + "'][test-type='" + key + "']").removeClass('sr-only');
						$eles.find("[message-for='" + test_id + "'][test-type='" + key + "']").closest('.form-group').addClass('has-error');
					}else{
						$eles.find("[message-for='"+test_id+"']").siblings().addClass('sr-only');
						$eles.find("[message-for='"+test_id+"']").removeClass('sr-only');
						$eles.find("[message-for='"+test_id+"']").closest('.form-group').addClass('has-error');
					}
					single_valid = false;
				}else{
					if($eles.find("[message-for='"+test_id+"']").size() > 1) {
						$eles.find("[message-for='" + test_id + "'][test-type='" + key + "']").addClass('sr-only');
						$eles.find("[message-for='" + test_id + "'][test-type='" + key + "']").closest('.form-group').removeClass('has-error');
					}else{
						$eles.find("[message-for='"+test_id+"']").addClass('sr-only');
						$eles.find("[message-for='"+test_id+"']").closest('.form-group').removeClass('has-error');
					}
				}
			}
			return single_valid;
		},
		/**
		 * 去除依赖检查
		 */
		delDepend:function(){
			var eles_path = this.eles_path;
			var $eles = this.$eles;
			//绑定去除依赖检查事件
			$(eles_path).on("change",'[test-depend]',function(){
				var $element = $(this);
				if (!$element.is(':checked')) {
					$eles.find("[data-depend]").each(function () {
						var $element2 = $(this);
						var test_id = $element2.attr("test-id");
						if ($element2.data('depend') == $element.attr("test-depend")) {
							$eles.find("[message-for='" + test_id + "']").addClass('sr-only');
							$eles.find("[message-for='" + test_id + "']").closest('.form-group').removeClass('has-error');
						}
					});
				}
			});
		},
		/**
		 * 用户添加自定义验证器
		 */
		extend: function(validators){
			$.extend(this.validators, validators);
		},

		getPath: function ($element) {
			if($element.length != 1)
				throw 'Requires one element.';

			var path,node = $element;
			while (node.length) {
				var realNode = node[0], name = realNode.localName;
				if (!name)
					break;
				name = name.toLowerCase();

				var parent = node.parent();

				var siblings = parent.children(name);
				if (siblings.length > 1) {
					name += ':eq(' + siblings.index(realNode) + ')';
				}

				path = name + ( path ? '>' + path : '');
				node = parent;
			}

			return path;
		}

	};

	/**
	 * 内置验证器
	 */
	SimValidate.prototype.validators = {
		distinct: function(value,param,point,obj){           //一组值不相等
			if(value==null || value.length==0) return true;
			var self_test_id = point.attr("test-id");
			var diff = false;
			$("[distinct='"+param+"']").each(function(){
				if(self_test_id != $(this).attr("test-id")&& value == $(this).val())
					diff = true;
			});
			return !diff;
		},

		equalTo: function(value,param,point,obj){//值是否相等
			if(value==null || value.length==0) return true;
			if(obj.settings['autoTest']) {
				var test_id = point.attr("test-id");
				$(obj.eles_path).on("blur", "[test-id='" + param + "']", function () {
					obj.$eles.find("[message-for='" + test_id + "']").addClass('sr-only');
					obj.$eles.find("[message-for='" + test_id + "']").closest('.form-group').removeClass('has-error');
					obj.testElement(point);
				});
			}
			if(obj.$eles.find("[test-id='"+param+"']").val()==value)
				return true;
			else
				return false;
		},
		required: function(value){//非空
			if(value==null || value.length==0)
				return false;
			else
				return true;
		},
		number: function(value){//数字
			if(value==null || value.length==0) return true;
			if(value.length > 0 && $.trim(value).length==0) return false;
			return !isNaN(value);
		},
		groupRequired:function(value, param, group){
			var valid = false;
			group.find("[test-point]").each(function(){
				if($(this).is(':checked'))
					valid=true;
			});
			return valid;
		},
		max: function(value,num){//最大值
			if(value==null || value.length==0) return true;
			if(parseFloat(value)>parseFloat(num))
				return false;
			else
				return true;
		},
		min: function(value,num){//最小值
			if(value==null || value.length==0) return true;
			if(parseFloat(value)<parseFloat(num))
				return false;
			else
				return true;
		},
		minlength:function(value,num){
			if(value==null || value.length==0) return true;
			if(value.length<parseFloat(num))
				return false;
			else
				return true;
		},
		email: function(value){//email
			if(value==null || value.length==0) return true;
			var reg = /^([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+@([a-zA-Z0-9]+[_|\_|\.]?)*[a-zA-Z0-9]+\.[a-zA-Z]{2,3}$/;
			if (reg.test(value)) {
				return true;
			} else {
				return false;
			}
		},
		mobile:function(value){//手机号码
			if(value==null || value.length==0) return true;
			var isMob=/^((\+?86)|(\(\+86\)))?(13[012356789][0-9]{8}|15[012356789][0-9]{8}|17[012356789][0-9]{8}|18[02356789][0-9]{8}|147[0-9]{8}|1349[0-9]{7})$/;
			if(isMob.test(value)){
				return true;
			}
			else{
				return false;
			}
		},
		tel:function(value){
			if(value==null || value.length==0) return true;
			var isTel=/^(0[0-9]{2,3}\-)?([2-9][0-9]{6,7})+(\-[0-9]{1,4})?$/;
			if(isTel.test(value)){
				return true;
			}
			else{
				return false;
			}
		},
		mobileOrTel:function(value){
			return mobile(value)||tel(value);
		},
		idcard:function(idCard) {//身份证号
			if(idCard==null || idCard.length==0) return true;
			//15位和18位身份证号码的正则表达式
			var regIdCard=/^(^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$)|(^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])((\d{4})|\d{3}[Xx])$)$/;
			if(regIdCard.test(idCard)){
				if(idCard.length==18){
					var idCardWi=new Array( 7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2 ); //将前17位加权因子保存在数组里
					var idCardY=new Array( 1, 0, 10, 9, 8, 7, 6, 5, 4, 3, 2 ); //这是除以11后，可能产生的11位余数、验证码，也保存成数组
					var idCardWiSum=0; //用来保存前17位各自乖以加权因子后的总和
					for(var i=0;i<17;i++){
						idCardWiSum+=idCard.substring(i,i+1)*idCardWi[i];
					}
					var idCardMod=idCardWiSum%11;//计算出校验码所在数组的位置
					var idCardLast=idCard.substring(17);//得到最后一位身份证号码
					//如果等于2，则说明校验码是10，身份证号码最后一位应该是X
					if(idCardMod==2){
						if(idCardLast=="X"||idCardLast=="x"){
							return true;
						}else{
							return false;
						}
					}else{
						//用计算出的验证码与最后一位身份证号码匹配，如果一致，说明通过，否则是无效的身份证号码
						if(idCardLast==idCardY[idCardMod]){
							return true;
						}else{
							return false;
						}
					}
				}
			}else{
				return false;
			}
		}
	};

})(jQuery, window, document);