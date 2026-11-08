(function(Ae){Object.defineProperty(Ae,Symbol.toStringTag,{value:"Module"});var Ye,S,ls,An,re,hs,ds,fs,Ot,Ze,We,ps,Ft,It,Rt,_s,Xe={},et=[],Wn=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,Ne=Array.isArray;function Y(e,t){for(var s in t)e[s]=t[s];return e}function Tt(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function Qe(e,t,s){var n,i,a,o={};for(a in t)a=="key"?n=t[a]:a=="ref"?i=t[a]:o[a]=t[a];if(arguments.length>2&&(o.children=arguments.length>3?Ye.call(arguments,2):s),typeof e=="function"&&e.defaultProps!=null)for(a in e.defaultProps)o[a]===void 0&&(o[a]=e.defaultProps[a]);return tt(e,o,n,i,null)}function tt(e,t,s,n,i){var a={type:e,props:t,key:s,ref:n,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:i??++ls,__i:-1,__u:0};return i==null&&S.vnode!=null&&S.vnode(a),a}function Se(e){return e.children}function Z(e,t){this.props=e,this.context=t}function he(e,t){if(t==null)return e.__?he(e.__,e.__i+1):null;for(var s;t<e.__k.length;t++)if((s=e.__k[t])!=null&&s.__e!=null)return s.__e;return typeof e.type=="function"?he(e):null}function Nn(e){if(e.__P&&e.__d){var t=e.__v,s=t.__e,n=[],i=[],a=Y({},t);a.__v=t.__v+1,S.vnode&&S.vnode(a),Et(e.__P,a,t,e.__n,e.__P.namespaceURI,32&t.__u?[s]:null,n,s??he(t),!!(32&t.__u),i),a.__v=t.__v,a.__.__k[a.__i]=a,ws(n,a,i),t.__e=t.__=null,a.__e!=s&&gs(a)}}function gs(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),gs(e)}function $t(e){(!e.__d&&(e.__d=!0)&&re.push(e)&&!st.__r++||hs!=S.debounceRendering)&&((hs=S.debounceRendering)||ds)(st)}function st(){try{for(var e,t=1;re.length;)re.length>t&&re.sort(fs),e=re.shift(),t=re.length,Nn(e)}finally{re.length=st.__r=0}}function vs(e,t,s,n,i,a,o,u,h,c,p){var d,l,f,v,w,m,P=n&&n.__k||et,y=t.length;for(h=Qn(s,t,P,h,y),d=0;d<y;d++)(f=s.__k[d])!=null&&(l=f.__i!=-1&&P[f.__i]||Xe,f.__i=d,m=Et(e,f,l,i,a,o,u,h,c,p),v=f.__e,f.ref&&l.ref!=f.ref&&(l.ref&&At(l.ref,null,f),p.push(f.ref,f.__c||v,f)),w==null&&v!=null&&(w=v),4&f.__u?(h=ms(f,h,e),l.__e&&(l.__e=null)):typeof f.type=="function"&&m!==void 0?h=m:v&&(h=v.nextSibling),f.__u&=-7);return s.__e=w,h}function Qn(e,t,s,n,i){var a,o,u,h,c,p=s.length,d=p,l=0;for(e.__k=new Array(i),a=0;a<i;a++)(o=t[a])!=null&&typeof o!="boolean"&&typeof o!="function"?(typeof o=="string"||typeof o=="number"||typeof o=="bigint"||o.constructor==String?o=e.__k[a]=tt(null,o,null,null,null):Ne(o)?o=e.__k[a]=tt(Se,{children:o},null,null,null):o.constructor===void 0&&o.__b>0?o=e.__k[a]=tt(o.type,o.props,o.key,o.ref?o.ref:null,o.__v):e.__k[a]=o,h=a+l,o.__=e,o.__b=e.__b+1,u=null,(c=o.__i=Un(o,s,h,d))!=-1&&(d--,(u=s[c])&&(u.__u|=2)),u==null||u.__v==null?(c==-1&&(i>p?l--:i<p&&l++),typeof o.type!="function"&&(o.__u|=4)):c!=h&&(c==h-1?l--:c==h+1?l++:(c>h?l--:l++,o.__u|=4))):e.__k[a]=null;if(d)for(a=0;a<p;a++)(u=s[a])!=null&&(2&u.__u)==0&&(u.__e==n&&(n=he(u)),Ss(u,u));return n}function ms(e,t,s){var n,i;if(typeof e.type=="function"){for(n=e.__k,i=0;n&&i<n.length;i++)n[i]&&(n[i].__=e,t=ms(n[i],t,s));return t}e.__e!=t&&(t&&e.type&&!t.parentNode&&(t=he(e)),t=s.insertBefore(e.__e,t||null));do t=t&&t.nextSibling;while(t!=null&&t.nodeType==8);return t}function nt(e,t){return t=t||[],e==null||typeof e=="boolean"||(Ne(e)?e.some(function(s){nt(s,t)}):t.push(e)),t}function Un(e,t,s,n){var i,a,o,u=e.key,h=e.type,c=t[s],p=c!=null&&(2&c.__u)==0;if(c===null&&u==null||p&&u==c.key&&h==c.type)return s;if(n>(p?1:0)){for(i=s-1,a=s+1;i>=0||a<t.length;)if((c=t[o=i>=0?i--:a++])!=null&&(2&c.__u)==0&&u==c.key&&h==c.type)return o}return-1}function ys(e,t,s){t[0]=="-"?e.setProperty(t,s??""):e[t]=s==null?"":typeof s!="number"||Wn.test(t)?s:s+"px"}function it(e,t,s,n,i){var a,o;e:if(t=="style")if(typeof s=="string")e.style.cssText=s;else{if(typeof n=="string"&&(e.style.cssText=n=""),n)for(t in n)s&&t in s||ys(e.style,t,"");if(s)for(t in s)n&&s[t]==n[t]||ys(e.style,t,s[t])}else if(t[0]=="o"&&t[1]=="n")a=t!=(t=t.replace(ps,"$1")),o=t.toLowerCase(),t=o in e||t=="onFocusOut"||t=="onFocusIn"?o.slice(2):t.slice(2),e.l||(e.l={}),e.l[t+a]=s,s?n?s[We]=n[We]:(s[We]=Ft,e.addEventListener(t,a?Rt:It,a)):e.removeEventListener(t,a?Rt:It,a);else{if(i=="http://www.w3.org/2000/svg")t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(t!="width"&&t!="height"&&t!="href"&&t!="list"&&t!="form"&&t!="tabIndex"&&t!="download"&&t!="rowSpan"&&t!="colSpan"&&t!="role"&&t!="popover"&&t in e)try{e[t]=s??"";break e}catch{}typeof s=="function"||(s==null||s===!1&&t[4]!="-"?e.removeAttribute(t):e.setAttribute(t,t=="popover"&&s==1?"":s))}}function bs(e){return function(t){if(this.l){var s=this.l[t.type+e];if(t[Ze]==null)t[Ze]=Ft++;else if(t[Ze]<s[We])return;return s(S.event?S.event(t):t)}}}function Et(e,t,s,n,i,a,o,u,h,c){var p,d,l,f,v,w,m,P,y,F,$,O,L,b,N,Q,C=t.type;if(t.constructor!==void 0)return null;128&s.__u&&(h=!!(32&s.__u),a=[u=t.__e=s.__e]),(p=S.__b)&&p(t);e:if(typeof C=="function"){d=o.length;try{if(y=t.props,F=C.prototype&&C.prototype.render,$=(p=C.contextType)&&n[p.__c],O=p?$?$.props.value:p.__:n,s.__c?P=(l=t.__c=s.__c).__=l.__E:(F?t.__c=l=new C(y,O):(t.__c=l=new Z(y,O),l.constructor=C,l.render=Ln),$&&$.sub(l),l.state||(l.state={}),l.__n=n,f=l.__d=!0,l.__h=[],l._sb=[]),F&&l.__s==null&&(l.__s=l.state),F&&C.getDerivedStateFromProps!=null&&(l.__s==l.state&&(l.__s=Y({},l.__s)),Y(l.__s,C.getDerivedStateFromProps(y,l.__s))),v=l.props,w=l.state,l.__v=t,f)F&&C.getDerivedStateFromProps==null&&l.componentWillMount!=null&&l.componentWillMount(),F&&l.componentDidMount!=null&&l.__h.push(l.componentDidMount);else{if(F&&C.getDerivedStateFromProps==null&&y!==v&&l.componentWillReceiveProps!=null&&l.componentWillReceiveProps(y,O),t.__v==s.__v||!l.__e&&l.shouldComponentUpdate!=null&&l.shouldComponentUpdate(y,l.__s,O)===!1){t.__v!=s.__v&&(l.props=y,l.state=l.__s,l.__d=!1),t.__e=s.__e,t.__k=s.__k,t.__k.some(function(H){H&&(H.__=t)}),et.push.apply(l.__h,l._sb),l._sb=[],l.__h.length&&o.push(l),u=he(s);break e}l.componentWillUpdate!=null&&l.componentWillUpdate(y,l.__s,O),F&&l.componentDidUpdate!=null&&l.__h.push(function(){l.componentDidUpdate(v,w,m)})}if(l.context=O,l.props=y,l.__P=e,l.__e=!1,L=S.__r,b=0,F)l.state=l.__s,l.__d=!1,L&&L(t),p=l.render(l.props,l.state,l.context),et.push.apply(l.__h,l._sb),l._sb=[];else do l.__d=!1,L&&L(t),p=l.render(l.props,l.state,l.context),l.state=l.__s;while(l.__d&&++b<25);l.state=l.__s,l.getChildContext!=null&&(n=Y(Y({},n),l.getChildContext())),F&&!f&&l.getSnapshotBeforeUpdate!=null&&(m=l.getSnapshotBeforeUpdate(v,w)),N=p!=null&&p.type===Se&&p.key==null?ks(p.props.children):p,u=vs(e,Ne(N)?N:[N],t,s,n,i,a,o,u,h,c),l.base=t.__e,t.__u&=-161,l.__h.length&&o.push(l),P&&(l.__E=l.__=null)}catch(H){if(o.length=d,t.__v=null,h||a!=null){if(H.then){for(t.__u|=h?160:128;u&&u.nodeType==8&&u.nextSibling;)u=u.nextSibling;a!=null&&(a[a.indexOf(u)]=null),t.__e=u}else if(a!=null)for(Q=a.length;Q--;)Tt(a[Q])}else t.__e=s.__e;t.__k??(t.__k=s.__k||[]),H.then||xs(t),S.__e(H,t,s)}}else a==null&&t.__v==s.__v?(t.__k=s.__k,t.__e=s.__e):u=t.__e=Dn(s.__e,t,s,n,i,a,o,h,c);return(p=S.diffed)&&p(t),128&t.__u?void 0:u}function xs(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some(xs))}function ws(e,t,s){for(var n=0;n<s.length;n++)At(s[n],s[++n],s[++n]);S.__c&&S.__c(t,e),e.some(function(i){try{e=i.__h,i.__h=[],e.some(function(a){a.call(i)})}catch(a){S.__e(a,i.__v)}})}function ks(e){return typeof e!="object"||e==null||e.__b>0?e:Ne(e)?e.map(ks):e.constructor!==void 0?null:Y({},e)}function Dn(e,t,s,n,i,a,o,u,h){var c,p,d,l,f,v,w,m=s.props||Xe,P=t.props,y=t.type;if(y=="svg"?i="http://www.w3.org/2000/svg":y=="math"?i="http://www.w3.org/1998/Math/MathML":i||(i="http://www.w3.org/1999/xhtml"),a!=null){for(c=0;c<a.length;c++)if((f=a[c])&&"setAttribute"in f==!!y&&(y?f.localName==y:f.nodeType==3)){e=f,a[c]=null;break}}if(e==null){if(y==null)return document.createTextNode(P);e=document.createElementNS(i,y,P.is&&P),u&&(S.__m&&S.__m(t,a),u=!1),a=null}if(y==null)m===P||u&&e.data==P||(e.data=P);else{if(a=y=="textarea"&&P.defaultValue!=null?null:a&&Ye.call(e.childNodes),!u&&a!=null)for(m={},c=0;c<e.attributes.length;c++)m[(f=e.attributes[c]).name]=f.value;for(c in m)f=m[c],c=="dangerouslySetInnerHTML"?d=f:c=="children"||c in P||c=="value"&&"defaultValue"in P||c=="checked"&&"defaultChecked"in P||it(e,c,null,f,i);for(c in P)f=P[c],c=="children"?l=f:c=="dangerouslySetInnerHTML"?p=f:c=="value"?v=f:c=="checked"?w=f:u&&typeof f!="function"||m[c]===f||it(e,c,f,m[c],i);if(p)u||d&&(p.__html==d.__html||p.__html==e.innerHTML)||(e.innerHTML=p.__html),t.__k=[];else if(d&&(e.innerHTML=""),vs(t.type=="template"?e.content:e,Ne(l)?l:[l],t,s,n,y=="foreignObject"?"http://www.w3.org/1999/xhtml":i,a,o,a?a[0]:s.__k&&he(s,0),u,h),a!=null)for(c=a.length;c--;)Tt(a[c]);u&&y!="textarea"||(c="value",y=="progress"&&v==null?e.removeAttribute("value"):v!=null&&(v!==e[c]||y=="progress"&&!v||y=="option"&&v!=m[c])&&it(e,c,v,m[c],i),c="checked",w!=null&&w!=e[c]&&it(e,c,w,m[c],i))}return e}function At(e,t,s){try{if(typeof e=="function"){var n=typeof e.__u=="function";n&&e.__u(),n&&t==null||(e.__u=e(t))}else e.current=t}catch(i){S.__e(i,s)}}function Ss(e,t,s){var n,i;if(S.unmount&&S.unmount(e),(n=e.ref)&&(n.current&&n.current!=e.__e||At(n,null,t)),(n=e.__c)!=null){if(n.componentWillUnmount)try{n.componentWillUnmount()}catch(a){S.__e(a,t)}n.base=n.__P=n.__n=null}if(n=e.__k)for(i=0;i<n.length;i++)n[i]&&Ss(n[i],t,s||typeof e.type!="function");s||Tt(e.__e),e.__c=e.__=e.__e=void 0}function Ln(e,t,s){return this.constructor(e,s)}function Ps(e,t,s){var n,i,a,o;t==document&&(t=document.documentElement),S.__&&S.__(e,t),i=(n=typeof s=="function")?null:s&&s.__k||t.__k,a=[],o=[],Et(t,e=(!n&&s||t).__k=Qe(Se,null,[e]),i||Xe,Xe,t.namespaceURI,!n&&s?[s]:i?null:t.firstChild?Ye.call(t.childNodes):null,a,!n&&s?s:i?i.__e:t.firstChild,n,o),ws(a,e,o),e.props.children=null}function Wt(e){function t(s){var n,i;return this.getChildContext||(n=new Set,(i={})[t.__c]=this,this.getChildContext=function(){return i},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(a){this.props.value!=a.value&&n.forEach(function(o){o.__e=!0,$t(o)})},this.sub=function(a){n.add(a);var o=a.componentWillUnmount;a.componentWillUnmount=function(){n&&n.delete(a),o&&o.call(a)}}),s.children}return t.__c="__cC"+_s++,t.__=e,t.Provider=t.__l=(t.Consumer=function(s,n){return s.children(n)}).contextType=t,t}Ye=et.slice,S={__e:function(e,t,s,n){for(var i,a,o;t=t.__;)if((i=t.__c)&&!i.__)try{if((a=i.constructor)&&a.getDerivedStateFromError!=null&&(i.setState(a.getDerivedStateFromError(e)),o=i.__d),i.componentDidCatch!=null&&(i.componentDidCatch(e,n||{}),o=i.__d),o)return i.__E=i}catch(u){e=u}throw e}},ls=0,An=function(e){return e!=null&&e.constructor===void 0},Z.prototype.setState=function(e,t){var s=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=Y({},this.state);typeof e=="function"&&(e=e(Y({},s),this.props)),e&&Y(s,e),e!=null&&this.__v&&(t&&this._sb.push(t),$t(this))},Z.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),$t(this))},Z.prototype.render=Se,re=[],ds=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,fs=function(e,t){return e.__v.__b-t.__v.__b},st.__r=0,Ot=Math.random().toString(8),Ze="__d"+Ot,We="__a"+Ot,ps=/(PointerCapture)$|Capture$/i,Ft=0,It=bs(!1),Rt=bs(!0),_s=0;var de,I,Nt,Ms,Ue=0,Cs=[],E=S,Os=E.__b,Fs=E.__r,Is=E.diffed,Rs=E.__c,Ts=E.unmount,$s=E.__;function De(e,t){E.__h&&E.__h(I,e,Ue||t),Ue=0;var s=I.__H||(I.__H={__:[],__h:[]});return e>=s.__.length&&s.__.push({}),s.__[e]}function X(e){return Ue=1,Bn(As,e)}function Bn(e,t,s){var n=De(de++,2);if(n.t=e,!n.__c&&(n.__=[s?s(t):As(void 0,t),function(u){var h=n.__N?n.__N[0]:n.__[0],c=n.t(h,u);h!==c&&(n.__N=[c,n.__[1]],n.__c.setState({}))}],n.__c=I,!I.__f)){var i=function(u,h,c){if(!n.__c.__H)return!0;var p=!1,d=n.__c.props!==u;if(n.__c.__H.__.some(function(f){if(f.__N){p=!0;var v=f.__[0];f.__=f.__N,f.__N=void 0,v!==f.__[0]&&(d=!0)}}),a){var l=a.call(this,u,h,c);return p?l||d:l}return!p||d};I.__f=!0;var a=I.shouldComponentUpdate,o=I.componentWillUpdate;I.componentWillUpdate=function(u,h,c){if(this.__e){var p=a;a=void 0,i(u,h,c),a=p}o&&o.call(this,u,h,c)},I.shouldComponentUpdate=i}return n.__N||n.__}function ee(e,t){var s=De(de++,3);!E.__s&&Dt(s.__H,t)&&(s.__=e,s.u=t,I.__H.__h.push(s))}function jn(e,t){var s=De(de++,4);!E.__s&&Dt(s.__H,t)&&(s.__=e,s.u=t,I.__h.push(s))}function Pe(e){return Ue=5,rt(function(){return{current:e}},[])}function rt(e,t){var s=De(de++,7);return Dt(s.__H,t)&&(s.__=e(),s.__H=t,s.__h=e),s.__}function fe(e,t){return Ue=8,rt(function(){return e},t)}function Qt(e){var t=I.context[e.__c],s=De(de++,9);return s.c=e,t?(s.__??(s.__=!0,t.sub(I)),t.props.value):e.__}function qn(){for(var e;e=Cs.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(at),t.__h.some(Ut),t.__h=[]}catch(s){t.__h=[],E.__e(s,e.__v)}}}E.__b=function(e){I=null,Os&&Os(e)},E.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),$s&&$s(e,t)},E.__r=function(e){Fs&&Fs(e),de=0;var t=(I=e.__c).__H;t&&(Nt===I?(t.__h=[],I.__h=[],t.__.some(function(s){s.__N&&(s.__=s.__N),s.u=s.__N=void 0})):(t.__h.some(at),t.__h.some(Ut),t.__h=[],de=0)),Nt=I},E.diffed=function(e){Is&&Is(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(Cs.push(t)!==1&&Ms===E.requestAnimationFrame||((Ms=E.requestAnimationFrame)||Hn)(qn)),t.__H.__.some(function(s){s.u&&(s.__H=s.u,s.u=void 0)})),Nt=I=null},E.__c=function(e,t){t.some(function(s){try{s.__h.some(at),s.__h=s.__h.filter(function(n){return!n.__||Ut(n)})}catch(n){t.some(function(i){i.__h&&(i.__h=[])}),t=[],E.__e(n,s.__v)}}),Rs&&Rs(e,t)},E.unmount=function(e){Ts&&Ts(e);var t,s=e.__c;s&&s.__H&&(s.__H.__.some(function(n){try{at(n)}catch(i){t=i}}),s.__H=void 0,t&&E.__e(t,s.__v))};var Es=typeof requestAnimationFrame=="function";function Hn(e){var t,s=function(){clearTimeout(n),Es&&cancelAnimationFrame(t),setTimeout(e)},n=setTimeout(s,35);Es&&(t=requestAnimationFrame(s))}function at(e){var t=I,s=e.__c;typeof s=="function"&&(e.__c=void 0,s()),I=t}function Ut(e){var t=I;e.__c=e.__(),I=t}function Dt(e,t){return!e||e.length!==t.length||t.some(function(s,n){return s!==e[n]})}function As(e,t){return typeof t=="function"?t(e):t}function Kn(e,t){for(var s in t)e[s]=t[s];return e}function Ws(e,t){for(var s in e)if(s!=="__source"&&!(s in t))return!0;for(var n in t)if(n!=="__source"&&e[n]!==t[n])return!0;return!1}function Ns(e,t){var s=t(),n=X({t:{__:s,u:t}}),i=n[0].t,a=n[1];return jn(function(){i.__=s,i.u=t,Lt(i)&&a({t:i})},[e,s,t]),ee(function(){return Lt(i)&&a({t:i}),e(function(){Lt(i)&&a({t:i})})},[e]),s}function Lt(e){try{return!((t=e.__)===(s=e.u())&&(t!==0||1/t==1/s)||t!=t&&s!=s)}catch{return!0}var t,s}function Qs(e,t){this.props=e,this.context=t}(Qs.prototype=new Z).isPureReactComponent=!0,Qs.prototype.shouldComponentUpdate=function(e,t){return Ws(this.props,e)||Ws(this.state,t)};var Us=S.__b;S.__b=function(e){e.type&&e.type.__f&&e.ref&&(e.props.ref=e.ref,e.ref=null),Us&&Us(e)};var cr=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.forward_ref")||3911,zn=S.__e;S.__e=function(e,t,s,n){if(e.then){for(var i,a=t;a=a.__;)if((i=a.__c)&&i.__c)return t.__e??(t.__e=s.__e,t.__k=s.__k||[]),i.__c(e,t)}zn(e,t,s,n)};var Ds=S.unmount;function Ls(e,t,s){return e&&(e.__c&&e.__c.__H&&(e.__c.__H.__.forEach(function(n){typeof n.__c=="function"&&n.__c()}),e.__c.__H=null),(e=Kn({},e)).__c!=null&&(e.__c.__P===s&&(e.__c.__P=t),e.__c.__e=!0,e.__c=null),e.__k=e.__k&&e.__k.map(function(n){return Ls(n,t,s)})),e}function Bs(e,t,s){return e&&s&&(e.__v=null,e.__k=e.__k&&e.__k.map(function(n){return Bs(n,t,s)}),e.__c&&e.__c.__P===t&&(e.__e&&s.appendChild(e.__e),e.__c.__e=!0,e.__c.__P=s)),e}function Bt(){this.__u=0,this.o=null,this.__b=null}function js(e){var t=e.__&&e.__.__c;return t&&t.__a&&t.__a(e)}function ot(){this.i=null,this.l=null}S.unmount=function(e){var t=e.__c;t&&(t.__z=!0),t&&t.__R&&t.__R(),t&&32&e.__u&&(e.type=null),Ds&&Ds(e)},(Bt.prototype=new Z).__c=function(e,t){var s=t.__c,n=this;n.o??(n.o=[]),n.o.push(s);var i=js(n.__v),a=!1,o=function(){a||n.__z||(a=!0,s.__R=null,i?i(h):h())};s.__R=o;var u=s.__P;s.__P=null;var h=function(){if(!--n.__u){if(n.state.__a){var c=n.state.__a;n.__v.__k[0]=Bs(c,c.__c.__P,c.__c.__O)}var p;for(n.setState({__a:n.__b=null});p=n.o.pop();)p.__P=u,p.forceUpdate()}};n.__u++||32&t.__u||n.setState({__a:n.__b=n.__v.__k[0]}),e.then(o,o)},Bt.prototype.componentWillUnmount=function(){this.o=[]},Bt.prototype.render=function(e,t){if(this.__b){if(this.__v.__k){var s=document.createElement("div"),n=this.__v.__k[0].__c;this.__v.__k[0]=Ls(this.__b,s,n.__O=n.__P)}this.__b=null}var i=t.__a&&Qe(Se,null,e.fallback);return i&&(i.__u&=-33),[Qe(Se,null,t.__a?null:e.children),i]};var qs=function(e,t,s){if(++s[1]===s[0]&&e.l.delete(t),e.props.revealOrder&&(e.props.revealOrder[0]!=="t"||!e.l.size))for(s=e.i;s;){for(;s.length>3;)s.pop()();if(s[1]<s[0])break;e.i=s=s[2]}};(ot.prototype=new Z).__a=function(e){var t=this,s=js(t.__v),n=t.l.get(e);return n[0]++,function(i){var a=function(){t.props.revealOrder?(n.push(i),qs(t,e,n)):i()};s?s(a):a()}},ot.prototype.render=function(e){this.i=null,this.l=new Map;var t=nt(e.children);e.revealOrder&&e.revealOrder[0]==="b"&&t.reverse();for(var s=t.length;s--;)this.l.set(t[s],this.i=[1,0,this.i]);return e.children},ot.prototype.componentDidUpdate=ot.prototype.componentDidMount=function(){var e=this;this.l.forEach(function(t,s){qs(e,s,t)})};var Gn=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.element")||60103,Vn=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,Jn=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,Yn=/[A-Z0-9]/g,Zn=typeof document<"u",Xn=function(e){return(typeof Symbol<"u"&&typeof Symbol()=="symbol"?/fil|che|rad/:/fil|che|ra/).test(e)};Z.prototype.isReactComponent=!0,["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(e){Object.defineProperty(Z.prototype,e,{configurable:!0,get:function(){return this["UNSAFE_"+e]},set:function(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:t})}})});var Hs=S.event;S.event=function(e){return Hs&&(e=Hs(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};var Ks,ei={configurable:!0,get:function(){return this.class}},zs=S.vnode;S.vnode=function(e){typeof e.type=="string"&&(function(t){var s=t.props,n=t.type,i={},a=n.indexOf("-")==-1;for(var o in s){var u=s[o];if(!(o==="value"&&"defaultValue"in s&&u==null||Zn&&o==="children"&&n==="noscript"||o==="class"||o==="className")){var h=o.toLowerCase();o==="defaultValue"&&"value"in s&&s.value==null?o="value":o==="download"&&u===!0?u="":h==="translate"&&u==="no"?u=!1:h[0]==="o"&&h[1]==="n"?h==="ondoubleclick"?o="ondblclick":h!=="onchange"||n!=="input"&&n!=="textarea"||Xn(s.type)?h==="onfocus"?o="onfocusin":h==="onblur"?o="onfocusout":Jn.test(o)&&(o=h):h=o="oninput":a&&Vn.test(o)?o=o.replace(Yn,"-$&").toLowerCase():u===null&&(u=void 0),h==="oninput"&&i[o=h]&&(o="oninputCapture"),i[o]=u}}n=="select"&&(i.multiple&&Array.isArray(i.value)&&(i.value=nt(s.children).forEach(function(c){c.props.selected=i.value.indexOf(c.props.value)!=-1})),i.defaultValue!=null&&(i.value=nt(s.children).forEach(function(c){c.props.selected=i.multiple?i.defaultValue.indexOf(c.props.value)!=-1:i.defaultValue==c.props.value}))),s.class&&!s.className?(i.class=s.class,Object.defineProperty(i,"className",ei)):s.className&&(i.class=i.className=s.className),t.props=i})(e),e.$$typeof=Gn,zs&&zs(e)};var Gs=S.__r;S.__r=function(e){Gs&&Gs(e),Ks=e.__c};var Vs=S.diffed;S.diffed=function(e){Vs&&Vs(e);var t=e.props,s=e.__e;s!=null&&e.type==="textarea"&&"value"in t&&t.value!==s.value&&(s.value=t.value==null?"":t.value),Ks=null};var ti=0,lr=Array.isArray;function _(e,t,s,n,i,a){t||(t={});var o,u,h=t;if("ref"in h)for(u in h={},t)u=="ref"?o=t[u]:h[u]=t[u];var c={type:e,props:h,key:s,ref:o,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--ti,__i:-1,__u:0,__source:i,__self:a};if(typeof e=="function"&&(o=e.defaultProps))for(u in o)h[u]===void 0&&(h[u]=o[u]);return S.vnode&&S.vnode(c),c}var Js=Wt(void 0),jt=e=>{const t=Qt(Js);if(e)return e;if(!t)throw new Error("No QueryClient set, use QueryClientProvider to set one");return t},si=({client:e,children:t})=>(ee(()=>(e.mount(),()=>{e.unmount()}),[e]),_(Js.Provider,{value:e,children:t}));function Ys(e,t){if(t.has(e))throw new TypeError("Cannot initialize the same private elements twice on an object")}function x(e,t,s){Ys(e,t),t.set(e,s)}function k(e,t,s){if(typeof e=="function"?e===t:e.has(t))return arguments.length<3?t:s;throw new TypeError("Private element is not present on this object")}function r(e,t){return e.get(k(e,t))}function g(e,t,s){return e.set(k(e,t),s),s}var pe,Zs,ni={setTimeout:(e,t)=>setTimeout(e,t),clearTimeout:e=>clearTimeout(e),setInterval:(e,t)=>setInterval(e,t),clearInterval:e=>clearInterval(e)},ii=(pe=new WeakMap,Zs=new WeakMap,class{constructor(){x(this,pe,ni),x(this,Zs,!1)}setTimeoutProvider(e){g(pe,this,e)}setTimeout(e,t){return r(pe,this).setTimeout(e,t)}clearTimeout(e){r(pe,this).clearTimeout(e)}setInterval(e,t){return r(pe,this).setInterval(e,t)}clearInterval(e){r(pe,this).clearInterval(e)}}),_e=new ii;function ri(e){setTimeout(e,0)}var ai=typeof window>"u"||"Deno"in globalThis;function B(){}function oi(e,t){return typeof e=="function"?e(t):e}function Xs(e){return typeof e=="number"&&e>=0&&e!==1/0}function en(e,t){return Math.max(e+(t||0)-Date.now(),0)}function R(e,t){return typeof e=="function"?e(t):e}function tn(e,t){const{type:s="all",exact:n,fetchStatus:i,predicate:a,queryKey:o,stale:u}=e;if(o){if(n){if(t.queryHash!==qt(o,t.options))return!1}else if(!Me(t.queryKey,o))return!1}if(s!=="all"){const h=t.isActive();if(s==="active"&&!h||s==="inactive"&&h)return!1}return!(typeof u=="boolean"&&t.isStale()!==u||i&&i!==t.state.fetchStatus||a&&!a(t))}function sn(e,t){const{exact:s,status:n,predicate:i,mutationKey:a}=e;if(a){if(!t.options.mutationKey)return!1;if(s){if(ge(t.options.mutationKey)!==ge(a))return!1}else if(!Me(t.options.mutationKey,a))return!1}return!(n&&t.state.status!==n||i&&!i(t))}function qt(e,t){return(t?.queryKeyHashFn||ge)(e)}function ge(e){return JSON.stringify(e,(t,s)=>Ht(s)?Object.keys(s).sort().reduce((n,i)=>(n[i]=s[i],n),{}):s)}function Me(e,t){if(e===t)return!0;if(typeof e!=typeof t)return!1;if(e&&t&&typeof e=="object"&&typeof t=="object"){if(Array.isArray(e)&&Array.isArray(t)){if(t.length>e.length)return!1;for(let n=0;n<t.length;n++)if(!Me(e[n],t[n]))return!1;return!0}const s=Object.keys(t);for(const n of s)if(!Me(e[n],t[n]))return!1;return!0}return!1}var ui=Object.prototype.hasOwnProperty;function nn(e,t,s=0){if(e===t)return e;if(s>500)return t;const n=rn(e)&&rn(t);if(!n&&!(Ht(e)&&Ht(t)))return t;const i=(n?e:Object.keys(e)).length,a=n?t:Object.keys(t),o=a.length,u=n?new Array(o):{};let h=0;for(let c=0;c<o;c++){const p=n?c:a[c],d=e[p],l=t[p];if(d===l){u[p]=d,(n?c<i:ui.call(e,p))&&h++;continue}if(d===null||l===null||typeof d!="object"||typeof l!="object"){u[p]=l;continue}const f=nn(d,l,s+1);u[p]=f,f===d&&h++}return i===o&&h===i?e:u}function ut(e,t){if(!t||Object.keys(e).length!==Object.keys(t).length)return!1;for(const s in e)if(e[s]!==t[s])return!1;return!0}function rn(e){return Array.isArray(e)&&e.length===Object.keys(e).length}function Ht(e){if(!an(e))return!1;const t=Object.getPrototypeOf(e),s=t?.constructor;if(s===void 0)return!0;if(typeof s!="function")return!1;const n=s.prototype;return!(!an(n)||!n.hasOwnProperty("isPrototypeOf")||t!==Object.prototype)}function an(e){return Object.prototype.toString.call(e)==="[object Object]"}function ci(e){return new Promise(t=>{_e.setTimeout(t,e)})}function Kt(e,t,s){return typeof s.structuralSharing=="function"?s.structuralSharing(e,t):s.structuralSharing!==!1?nn(e,t):t}function li(e,t,s=0){const n=[...e,t];return s&&n.length>s?n.slice(1):n}function hi(e,t,s=0){const n=[t,...e];return s&&n.length>s?n.slice(0,-1):n}var zt=Symbol();function on(e,t){return!e.queryFn&&t?.initialPromise?()=>t.initialPromise:!e.queryFn||e.queryFn===zt?()=>Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`)):e.queryFn}function Gt(e,t){return typeof e=="function"?e(...t):!!e}function di(e,t,s){let n=!1,i;return Object.defineProperty(e,"signal",{enumerable:!0,get:()=>(i??(i=t()),n||(n=!0,i.aborted?s():i.addEventListener("abort",s,{once:!0})),i)}),e}var fi=()=>ai,Vt=()=>fi(),Ce=class{constructor(){this.listeners=new Set,this.subscribe=this.subscribe.bind(this)}subscribe(e){return this.listeners.add(e),this.onSubscribe(),()=>{this.listeners.delete(e),this.onUnsubscribe()}}hasListeners(){return this.listeners.size>0}onSubscribe(){}onUnsubscribe(){}},Le=new WeakMap,Oe=new WeakMap,ct=new WeakMap,pi=class extends Ce{constructor(){super(),x(this,Le,void 0),x(this,Oe,void 0),x(this,ct,void 0),g(ct,this,e=>{if(typeof window<"u"&&window.addEventListener){const t=()=>e();return window.addEventListener("visibilitychange",t,!1),()=>{window.removeEventListener("visibilitychange",t)}}})}onSubscribe(){r(Oe,this)||this.setEventListener(r(ct,this))}onUnsubscribe(){this.hasListeners()||(r(Oe,this)?.call(this),g(Oe,this,void 0))}setEventListener(e){g(ct,this,e),r(Oe,this)?.call(this),g(Oe,this,e(t=>{typeof t=="boolean"?this.setFocused(t):this.onFocus()}))}setFocused(e){r(Le,this)!==e&&(g(Le,this,e),this.onFocus())}onFocus(){const e=this.isFocused();this.listeners.forEach(t=>{t(e)})}isFocused(){return typeof r(Le,this)=="boolean"?r(Le,this):globalThis.document?.visibilityState!=="hidden"}},Jt=new pi,_i=ri;function gi(){let e=[],t=0,s=u=>{u()},n=u=>{u()},i=_i;const a=u=>{t?e.push(u):i(()=>{s(u)})},o=()=>{const u=e;e=[],u.length&&i(()=>{n(()=>{u.forEach(h=>{s(h)})})})};return{batch:u=>{let h;t++;try{h=u()}finally{t--,t||o()}return h},batchCalls:u=>(...h)=>{a(()=>{u(...h)})},schedule:a,setNotifyFunction:u=>{s=u},setBatchNotifyFunction:u=>{n=u},setScheduler:u=>{i=u}}}var U=gi(),lt=new WeakMap,Fe=new WeakMap,ht=new WeakMap,vi=class extends Ce{constructor(){super(),x(this,lt,!0),x(this,Fe,void 0),x(this,ht,void 0),g(ht,this,e=>{if(typeof window<"u"&&window.addEventListener){const t=()=>e(!0),s=()=>e(!1);return window.addEventListener("online",t,!1),window.addEventListener("offline",s,!1),()=>{window.removeEventListener("online",t),window.removeEventListener("offline",s)}}})}onSubscribe(){r(Fe,this)||this.setEventListener(r(ht,this))}onUnsubscribe(){this.hasListeners()||(r(Fe,this)?.call(this),g(Fe,this,void 0))}setEventListener(e){g(ht,this,e),r(Fe,this)?.call(this),g(Fe,this,e(this.setOnline.bind(this)))}setOnline(e){r(lt,this)!==e&&(g(lt,this,e),this.listeners.forEach(t=>{t(e)}))}isOnline(){return r(lt,this)}},dt=new vi;function mi(e){return Math.min(1e3*2**e,3e4)}function un(e){return(e??"online")==="online"?dt.isOnline():!0}var Yt=class extends Error{constructor(e){super("CancelledError"),this.revert=e?.revert,this.silent=e?.silent}};function cn(e){let t=!1,s=0,n,i="pending",a,o;const u=new Promise((y,F)=>{a=y,o=F});u.catch(B);const h=()=>i!=="pending",c=y=>{if(!h()){const F=new Yt(y);w(F),e.onCancel?.(F)}},p=()=>{t=!0},d=()=>{t=!1},l=()=>Jt.isFocused()&&(e.networkMode==="always"||dt.isOnline())&&e.canRun(),f=()=>un(e.networkMode)&&e.canRun(),v=y=>{h()||(n?.(),i="resolved",a(y))},w=y=>{h()||(n?.(),i="rejected",o(y))},m=()=>new Promise(y=>{n=F=>{(h()||l())&&y(F)},e.onPause?.()}).then(()=>{n=void 0,h()||e.onContinue?.()}),P=()=>{if(h())return;let y;const F=s===0?e.initialPromise:void 0;try{y=F??e.fn()}catch($){y=Promise.reject($)}Promise.resolve(y).then(v).catch($=>{if(h())return;const O=e.retry??(Vt()?0:3),L=e.retryDelay??mi,b=typeof L=="function"?L(s,$):L,N=O===!0||typeof O=="number"&&s<O||typeof O=="function"&&O(s,$);if(t||!N){w($);return}s++,e.onFail?.(s,$),ci(b).then(()=>l()?void 0:m()).then(()=>{t?w($):P()})})};return{promise:u,status:()=>i,cancel:c,continue:()=>(n?.(),u),cancelRetry:p,continueRetry:d,canStart:f,start:()=>(f()?P():m().then(P),u)}}var Be=new WeakMap,ln=class{constructor(){x(this,Be,void 0)}destroy(){this.clearGcTimeout()}scheduleGc(){this.clearGcTimeout(),Xs(this.gcTime)&&g(Be,this,_e.setTimeout(()=>{this.optionalRemove()},this.gcTime))}updateGcTime(e){this.gcTime=Math.max(this.gcTime||0,e??(Vt()?1/0:3e5))}clearGcTimeout(){r(Be,this)!==void 0&&(_e.clearTimeout(r(Be,this)),g(Be,this,void 0))}};function yi(e){return{onFetch:(t,s)=>{const n=t.options,i=t.fetchOptions?.meta?.fetchMore?.direction,a=t.state.data?.pages||[],o=t.state.data?.pageParams||[];let u={pages:[],pageParams:[]},h=0;const c=async()=>{let p=!1;const d=v=>{di(v,()=>t.signal,()=>p=!0)},l=on(t.options,t.fetchOptions),f=async(v,w,m)=>{if(p)return Promise.reject(t.signal.reason);if(w==null&&v.pages.length)return Promise.resolve(v);const y=(()=>{const L={client:t.client,queryKey:t.queryKey,pageParam:w,direction:m?"backward":"forward",meta:t.options.meta};return d(L),L})(),F=await l(y),{maxPages:$}=t.options,O=m?hi:li;return{pages:O(v.pages,F,$),pageParams:O(v.pageParams,w,$)}};if(i&&a.length){const v=i==="backward",w=v?hn:Zt,m={pages:a,pageParams:o};u=await f(m,w(n,m),v)}else{const v=e??a.length;do{const w=h===0?o[0]??n.initialPageParam:Zt(n,u);if(h>0&&w==null)break;u=await f(u,w),h++}while(h<v)}return u};t.options.persister?t.fetchFn=()=>t.options.persister?.(c,{client:t.client,queryKey:t.queryKey,meta:t.options.meta,signal:t.signal},s):t.fetchFn=c}}}function Zt(e,{pages:t,pageParams:s}){const n=t.length-1;return t.length>0?e.getNextPageParam(t[n],t,s[n],s):void 0}function hn(e,{pages:t,pageParams:s}){return t.length>0?e.getPreviousPageParam?.(t[0],t,s[0],s):void 0}function bi(e,t){return t?Zt(e,t)!=null:!1}function xi(e,t){return!t||!e.getPreviousPageParam?!1:hn(e,t)!=null}function ft(e,t){Ys(e,t),t.add(e)}var pt=new WeakMap,je=new WeakMap,_t=new WeakMap,J=new WeakMap,qe=new WeakMap,D=new WeakMap,Xt=new WeakMap,He=new WeakMap,te=new WeakSet,wi=class extends ln{constructor(e){super(),ft(this,te),x(this,pt,void 0),x(this,je,void 0),x(this,_t,void 0),x(this,J,void 0),x(this,qe,void 0),x(this,D,void 0),x(this,Xt,void 0),x(this,He,void 0),g(He,this,!1),g(Xt,this,e.defaultOptions),this.setOptions(e.options),this.observers=[],g(qe,this,e.client),g(J,this,r(qe,this).getQueryCache()),this.queryKey=e.queryKey,this.queryHash=e.queryHash,g(je,this,pn(this.options)),this.state=e.state??r(je,this),this.scheduleGc()}get meta(){return this.options.meta}get queryType(){return r(pt,this)}get promise(){return r(D,this)?.promise}setOptions(e){if(this.options={...r(Xt,this),...e},e?._type&&g(pt,this,e._type),this.updateGcTime(this.options.gcTime),this.state&&this.state.data===void 0){const t=pn(this.options);t.data!==void 0&&(this.setState(fn(t.data,t.dataUpdatedAt)),g(je,this,t))}}optionalRemove(){!this.observers.length&&this.state.fetchStatus==="idle"&&r(J,this).remove(this)}setData(e,t){const s=Kt(this.state.data,e,this.options);return k(te,this,ae).call(this,{data:s,type:"success",dataUpdatedAt:t?.updatedAt,manual:t?.manual}),s}setState(e){k(te,this,ae).call(this,{type:"setState",state:e})}cancel(e){const t=r(D,this)?.promise;return r(D,this)?.cancel(e),t?t.then(B).catch(B):Promise.resolve()}destroy(){super.destroy(),this.cancel({silent:!0})}get resetState(){return r(je,this)}reset(){this.destroy(),this.setState(this.resetState)}isActive(){return this.observers.some(e=>R(e.options.enabled,this)!==!1)}isDisabled(){return this.getObserversCount()>0?!this.isActive():this.options.queryFn===zt||!this.isFetched()}isFetched(){return this.state.dataUpdateCount+this.state.errorUpdateCount>0}isStatic(){return this.getObserversCount()>0?this.observers.some(e=>R(e.options.staleTime,this)==="static"):!1}isStale(){return this.getObserversCount()>0?this.observers.some(e=>e.getCurrentResult().isStale):this.state.data===void 0||this.state.isInvalidated}isStaleByTime(e=0){return this.state.data===void 0?!0:e==="static"?!1:this.state.isInvalidated?!0:!en(this.state.dataUpdatedAt,e)}onFocus(){this.observers.find(e=>e.shouldFetchOnWindowFocus())?.refetch({cancelRefetch:!1}),r(D,this)?.continue()}onOnline(){this.observers.find(e=>e.shouldFetchOnReconnect())?.refetch({cancelRefetch:!1}),r(D,this)?.continue()}addObserver(e){this.observers.includes(e)||(this.observers.push(e),this.clearGcTimeout(),r(J,this).notify({type:"observerAdded",query:this,observer:e}))}removeObserver(e){const t=this.observers.indexOf(e);t!==-1&&(this.observers.splice(t,1),this.observers.length||(r(D,this)&&(r(He,this)||this.state.fetchStatus==="paused"&&this.state.status==="pending"?r(D,this).cancel({revert:!0}):r(D,this).cancelRetry()),this.scheduleGc()),r(J,this).notify({type:"observerRemoved",query:this,observer:e}))}getObserversCount(){return this.observers.length}invalidate(){this.state.isInvalidated||k(te,this,ae).call(this,{type:"invalidate"})}async fetch(e,t){if(this.state.fetchStatus!=="idle"&&r(D,this)?.status()!=="rejected"){if(this.state.data!==void 0&&t?.cancelRefetch)this.cancel({silent:!0});else if(r(D,this))return r(D,this).continueRetry(),r(D,this).promise}if(e&&this.setOptions(e),!this.options.queryFn){const h=this.observers.find(c=>c.options.queryFn);h&&this.setOptions(h.options)}const s=new AbortController,n=h=>{Object.defineProperty(h,"signal",{enumerable:!0,get:()=>(g(He,this,!0),s.signal)})},i=()=>{const h=on(this.options,t),p=(()=>{const d={client:r(qe,this),queryKey:this.queryKey,meta:this.meta};return n(d),d})();return g(He,this,!1),this.options.persister?this.options.persister(h,p,this):h(p)},o=(()=>{const h={fetchOptions:t,options:this.options,queryKey:this.queryKey,client:r(qe,this),state:this.state,fetchFn:i};return n(h),h})();(r(pt,this)==="infinite"?yi(this.options.pages):this.options.behavior)?.onFetch(o,this),g(_t,this,this.state),(this.state.fetchStatus==="idle"||this.state.fetchMeta!==o.fetchOptions?.meta)&&k(te,this,ae).call(this,{type:"fetch",meta:o.fetchOptions?.meta});const u=g(D,this,cn({initialPromise:t?.initialPromise,fn:o.fetchFn,onCancel:h=>{h instanceof Yt&&h.revert&&this.setState({...r(_t,this),fetchStatus:"idle"}),s.abort()},onFail:(h,c)=>{k(te,this,ae).call(this,{type:"failed",failureCount:h,error:c})},onPause:()=>{k(te,this,ae).call(this,{type:"pause"})},onContinue:()=>{k(te,this,ae).call(this,{type:"continue"})},retry:o.options.retry,retryDelay:o.options.retryDelay,networkMode:o.options.networkMode,canRun:()=>!0}));try{const h=await u.start();if(h===void 0)throw new Error(`${this.queryHash} data is undefined`);return this.setData(h),r(J,this).config.onSuccess?.(h,this),r(J,this).config.onSettled?.(h,this.state.error,this),h}catch(h){if(h instanceof Yt){if(h.silent)return r(D,this).promise;if(h.revert){if(this.state.data===void 0)throw h;return this.state.data}}throw k(te,this,ae).call(this,{type:"error",error:h}),r(J,this).config.onError?.(h,this),r(J,this).config.onSettled?.(this.state.data,h,this),h}finally{r(D,this)===u&&g(D,this,void 0),this.scheduleGc()}}};function ae(e){const t=s=>{switch(e.type){case"failed":return{...s,fetchFailureCount:e.failureCount,fetchFailureReason:e.error};case"pause":return{...s,fetchStatus:"paused"};case"continue":return{...s,fetchStatus:"fetching"};case"fetch":return{...s,...dn(s.data,this.options),fetchMeta:e.meta??null};case"success":const n={...s,...fn(e.data,e.dataUpdatedAt),dataUpdateCount:s.dataUpdateCount+1,...!e.manual&&{fetchStatus:"idle",fetchFailureCount:0,fetchFailureReason:null}};return g(_t,this,e.manual?n:void 0),n;case"error":const i=e.error;return{...s,error:i,errorUpdateCount:s.errorUpdateCount+1,errorUpdatedAt:Date.now(),fetchFailureCount:s.fetchFailureCount+1,fetchFailureReason:i,fetchStatus:"idle",status:"error",isInvalidated:!0};case"invalidate":return{...s,isInvalidated:!0};case"setState":return{...s,...e.state}}};this.state=t(this.state),U.batch(()=>{this.observers.slice().forEach(s=>{s.onQueryUpdate()}),r(J,this).notify({query:this,type:"updated",action:e})})}function dn(e,t){return{fetchFailureCount:0,fetchFailureReason:null,fetchStatus:un(t.networkMode)?"fetching":"paused",...e===void 0&&{error:null,status:"pending"}}}function fn(e,t){return{data:e,dataUpdatedAt:t??Date.now(),error:null,isInvalidated:!1,status:"success"}}function pn(e){const t=typeof e.initialData=="function"?e.initialData():e.initialData,s=t!==void 0,n=s?typeof e.initialDataUpdatedAt=="function"?e.initialDataUpdatedAt():e.initialDataUpdatedAt:0;return{data:t,dataUpdateCount:0,dataUpdatedAt:s?n??Date.now():0,error:null,errorUpdateCount:0,errorUpdatedAt:0,fetchFailureCount:0,fetchFailureReason:null,fetchMeta:null,isInvalidated:!1,status:s?"success":"pending",fetchStatus:"idle"}}var K=new WeakMap,M=new WeakMap,es=new WeakMap,z=new WeakMap,Ke=new WeakMap,gt=new WeakMap,ve=new WeakMap,ts=new WeakMap,vt=new WeakMap,mt=new WeakMap,ze=new WeakMap,Ge=new WeakMap,Ie=new WeakMap,yt=new WeakMap,A=new WeakSet,ki=class extends Ce{constructor(e,t){super(),ft(this,A),x(this,K,void 0),x(this,M,void 0),x(this,es,void 0),x(this,z,void 0),x(this,Ke,void 0),x(this,gt,void 0),x(this,ve,void 0),x(this,ts,void 0),x(this,vt,void 0),x(this,mt,void 0),x(this,ze,void 0),x(this,Ge,void 0),x(this,Ie,void 0),x(this,yt,new Set),this.options=t,g(K,this,e),g(ve,this,null),this.bindMethods(),this.setOptions(t)}bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){this.listeners.size===1&&(r(M,this).addObserver(this),kn(r(M,this),this.options)?k(A,this,bt).call(this):this.updateResult(),k(A,this,yn).call(this))}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return ss(r(M,this),this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return ss(r(M,this),this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,k(A,this,bn).call(this),k(A,this,xn).call(this),r(M,this).removeObserver(this)}setOptions(e){const t=this.options,s=r(M,this);if(this.options=r(K,this).defaultQueryOptions(e),this.options.enabled!==void 0&&typeof this.options.enabled!="boolean"&&typeof this.options.enabled!="function"&&typeof R(this.options.enabled,r(M,this))!="boolean")throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");k(A,this,wn).call(this),r(M,this).setOptions(this.options),t._defaulted&&!ut(this.options,t)&&r(K,this).getQueryCache().notify({type:"observerOptionsUpdated",query:r(M,this),observer:this});const n=this.hasListeners();n&&Sn(r(M,this),s,this.options,t)&&k(A,this,bt).call(this),this.updateResult(),n&&(r(M,this)!==s||R(this.options.enabled,r(M,this))!==R(t.enabled,r(M,this))||R(this.options.staleTime,r(M,this))!==R(t.staleTime,r(M,this)))&&k(A,this,gn).call(this);const i=k(A,this,vn).call(this);n&&(r(M,this)!==s||R(this.options.enabled,r(M,this))!==R(t.enabled,r(M,this))||i!==r(Ie,this))&&k(A,this,mn).call(this,i)}getOptimisticResult(e){const t=r(K,this).getQueryCache().build(r(K,this),e),s=this.createResult(t,e);return ut(this.getCurrentResult(),s)||(g(z,this,s),g(gt,this,this.options),g(Ke,this,r(M,this).state)),s}getCurrentResult(){return r(z,this)}trackResult(e,t){return new Proxy(e,{get:(s,n)=>(this.trackProp(n),t?.(n),Reflect.get(s,n))})}trackProp(e){r(yt,this).add(e)}getCurrentQuery(){return r(M,this)}refetch({...e}={}){return this.fetch({...e})}fetchOptimistic(e){const t=r(K,this).defaultQueryOptions(e),s=r(K,this).getQueryCache().build(r(K,this),t);let n=()=>{},i;const a=new Promise(o=>{i=o,n=r(K,this).getQueryCache().subscribe(u=>{u.type==="updated"&&u.query.queryHash===s.queryHash&&s.state.data!==void 0&&(n(),o(this.createResult(s,t)))})});return Promise.race([s.fetch().then(()=>{const o=this.createResult(s,t);return i?.(o),o}).finally(()=>{n()}),a])}fetch(e){return k(A,this,bt).call(this,{...e,cancelRefetch:e.cancelRefetch??!0}).then(()=>(this.updateResult(),r(z,this)))}createResult(e,t){const s=r(M,this),n=this.options,i=r(z,this),a=r(Ke,this),o=r(gt,this),u=e!==s?e.state:r(es,this),{state:h}=e;let c={...h},p=!1,d;if(t._optimisticResults){const O=this.hasListeners(),L=!O&&kn(e,t),b=O&&Sn(e,s,t,n);(L||b)&&(c={...c,...dn(h.data,e.options)}),t._optimisticResults==="isRestoring"&&(c.fetchStatus="idle")}let{error:l,errorUpdatedAt:f,status:v}=c;d=c.data;let w=!1;if(t.placeholderData!==void 0&&d===void 0&&v==="pending"){let O;i?.isPlaceholderData&&t.placeholderData===o?.placeholderData?(O=i.data,w=!0):O=typeof t.placeholderData=="function"?t.placeholderData(r(mt,this)?.state.data,r(mt,this)):t.placeholderData,O!==void 0&&(v="success",d=Kt(i?.data,O,t),p=!0)}if(t.select&&d!==void 0&&!w)if(i&&d===a?.data&&t.select===r(ts,this))d=r(vt,this);else try{g(ts,this,t.select),d=t.select(d),d=Kt(i?.data,d,t),g(vt,this,d),g(ve,this,null)}catch(O){g(ve,this,O)}else d===void 0&&g(ve,this,null);r(ve,this)&&(l=r(ve,this),d=r(vt,this),f=Date.now(),v="error",p=!1);const m=c.fetchStatus==="fetching",P=v==="pending",y=v==="error",F=P&&m,$=d!==void 0;return{status:v,fetchStatus:c.fetchStatus,isPending:P,isSuccess:v==="success",isError:y,isInitialLoading:F,isLoading:F,data:d,dataUpdatedAt:c.dataUpdatedAt,error:l,errorUpdatedAt:f,failureCount:c.fetchFailureCount,failureReason:c.fetchFailureReason,errorUpdateCount:c.errorUpdateCount,isFetched:e.isFetched(),isFetchedAfterMount:c.dataUpdateCount>u.dataUpdateCount||c.errorUpdateCount>u.errorUpdateCount,isFetching:m,isRefetching:m&&!P,isLoadingError:y&&!$,isPaused:c.fetchStatus==="paused",isPlaceholderData:p,isRefetchError:y&&$,isStale:ns(e,t),refetch:this.refetch,isEnabled:R(t.enabled,e)!==!1}}updateResult(){const e=r(z,this),t=this.createResult(r(M,this),this.options);if(g(Ke,this,r(M,this).state),g(gt,this,this.options),r(Ke,this).data!==void 0&&g(mt,this,r(M,this)),ut(t,e))return;g(z,this,t);const n=(()=>{if(!e)return!0;const{notifyOnChangeProps:i}=this.options,a=typeof i=="function"?i():i;if(a==="all"||!a&&!r(yt,this).size)return!0;const o=new Set(a??r(yt,this));return this.options.throwOnError&&o.add("error"),Object.keys(r(z,this)).some(u=>{const h=u;return r(z,this)[h]!==e[h]&&o.has(h)})})();U.batch(()=>{n&&this.listeners.forEach(i=>{i(r(z,this))}),r(K,this).getQueryCache().notify({query:r(M,this),type:"observerResultsUpdated"})})}onQueryUpdate(){this.updateResult(),this.hasListeners()&&k(A,this,yn).call(this)}};function bt(e){k(A,this,wn).call(this);let t=r(M,this).fetch(this.options,e);return e?.throwOnError||(t=t.catch(B)),t}function _n(e){return!Vt()&&R(this.options.enabled,r(M,this))!==!1&&Xs(e)}function gn(){k(A,this,bn).call(this);const e=R(this.options.staleTime,r(M,this));if(r(z,this).isStale||!k(A,this,_n).call(this,e))return;const t=en(r(z,this).dataUpdatedAt,e)+1;g(ze,this,_e.setTimeout(()=>{r(z,this).isStale||this.updateResult()},t))}function vn(){return R(this.options.refetchInterval,r(M,this))??!1}function mn(e){k(A,this,xn).call(this),g(Ie,this,e),!(r(Ie,this)===0||!k(A,this,_n).call(this,r(Ie,this)))&&g(Ge,this,_e.setInterval(()=>{(this.options.refetchIntervalInBackground||Jt.isFocused())&&k(A,this,bt).call(this)},r(Ie,this)))}function yn(){k(A,this,gn).call(this),k(A,this,mn).call(this,k(A,this,vn).call(this))}function bn(){r(ze,this)!==void 0&&(_e.clearTimeout(r(ze,this)),g(ze,this,void 0))}function xn(){r(Ge,this)!==void 0&&(_e.clearInterval(r(Ge,this)),g(Ge,this,void 0))}function wn(){const e=r(K,this).getQueryCache().build(r(K,this),this.options);if(e===r(M,this))return;const t=r(M,this);g(M,this,e),g(es,this,e.state),this.hasListeners()&&(t?.removeObserver(this),e.addObserver(this))}function Si(e,t){return R(t.enabled,e)!==!1&&e.state.data===void 0&&!(e.state.status==="error"&&R(t.retryOnMount,e)===!1)}function kn(e,t){return Si(e,t)||e.state.data!==void 0&&ss(e,t,t.refetchOnMount)}function ss(e,t,s){if(R(t.enabled,e)!==!1&&R(t.staleTime,e)!=="static"){const n=R(s,e);return n==="always"||n!==!1&&ns(e,t)}return!1}function Sn(e,t,s,n){return(e!==t||R(n.enabled,e)===!1)&&(!s.suspense||e.state.status!=="error")&&ns(e,s)}function ns(e,t){return R(t.enabled,e)!==!1&&e.isStaleByTime(R(t.staleTime,e))}var Pi=class extends ki{constructor(e,t){super(e,t)}bindMethods(){super.bindMethods(),this.fetchNextPage=this.fetchNextPage.bind(this),this.fetchPreviousPage=this.fetchPreviousPage.bind(this)}setOptions(e){e._type="infinite",super.setOptions(e)}getOptimisticResult(e){return e._type="infinite",super.getOptimisticResult(e)}fetchNextPage(e){return this.fetch({...e,meta:{fetchMore:{direction:"forward"}}})}fetchPreviousPage(e){return this.fetch({...e,meta:{fetchMore:{direction:"backward"}}})}createResult(e,t){const{state:s}=e,n=super.createResult(e,t),{isFetching:i,isRefetching:a,isError:o,isRefetchError:u}=n,h=s.fetchMeta?.fetchMore?.direction,c=o&&h==="forward",p=i&&h==="forward",d=o&&h==="backward",l=i&&h==="backward";return{...n,fetchNextPage:this.fetchNextPage,fetchPreviousPage:this.fetchPreviousPage,hasNextPage:bi(t,s.data),hasPreviousPage:xi(t,s.data),isFetchNextPageError:c,isFetchingNextPage:p,isFetchPreviousPageError:d,isFetchingPreviousPage:l,isRefetchError:u&&!c&&!d,isRefetching:a&&!p&&!l}}},is=new WeakMap,oe=new WeakMap,j=new WeakMap,Ve=new WeakMap,ue=new WeakSet,Mi=class extends ln{constructor(e){super(),ft(this,ue),x(this,is,void 0),x(this,oe,void 0),x(this,j,void 0),x(this,Ve,void 0),g(is,this,e.client),this.mutationId=e.mutationId,g(j,this,e.mutationCache),g(oe,this,[]),this.state=e.state||Pn(),this.setOptions(e.options),this.scheduleGc()}setOptions(e){this.options=e,this.updateGcTime(this.options.gcTime)}get meta(){return this.options.meta}addObserver(e){r(oe,this).includes(e)||(r(oe,this).push(e),this.clearGcTimeout(),r(j,this).notify({type:"observerAdded",mutation:this,observer:e}))}removeObserver(e){g(oe,this,r(oe,this).filter(t=>t!==e)),this.scheduleGc(),r(j,this).notify({type:"observerRemoved",mutation:this,observer:e})}optionalRemove(){r(oe,this).length||(this.state.status==="pending"?this.scheduleGc():r(j,this).remove(this))}continue(){return r(Ve,this)?.continue()??(this.state.status==="pending"?this.execute(this.state.variables):Promise.resolve())}async execute(e){const t=()=>{k(ue,this,me).call(this,{type:"continue"})},s={client:r(is,this),meta:this.options.meta,mutationKey:this.options.mutationKey},n=g(Ve,this,cn({fn:()=>this.options.mutationFn?this.options.mutationFn(e,s):Promise.reject(new Error("No mutationFn found")),onFail:(o,u)=>{k(ue,this,me).call(this,{type:"failed",failureCount:o,error:u})},onPause:()=>{k(ue,this,me).call(this,{type:"pause"})},onContinue:t,retry:this.options.retry??0,retryDelay:this.options.retryDelay,networkMode:this.options.networkMode,canRun:()=>r(j,this).canRun(this)})),i=this.state.status==="pending",a=!n.canStart();try{if(i)t();else{k(ue,this,me).call(this,{type:"pending",variables:e,isPaused:a}),r(j,this).config.onMutate&&await r(j,this).config.onMutate(e,this,s);const u=await this.options.onMutate?.(e,s);u!==this.state.context&&k(ue,this,me).call(this,{type:"pending",context:u,variables:e,isPaused:a})}const o=await n.start();return await r(j,this).config.onSuccess?.(o,e,this.state.context,this,s),await this.options.onSuccess?.(o,e,this.state.context,s),await r(j,this).config.onSettled?.(o,null,this.state.variables,this.state.context,this,s),await this.options.onSettled?.(o,null,e,this.state.context,s),k(ue,this,me).call(this,{type:"success",data:o}),o}catch(o){try{await r(j,this).config.onError?.(o,e,this.state.context,this,s)}catch(u){Promise.reject(u)}try{await this.options.onError?.(o,e,this.state.context,s)}catch(u){Promise.reject(u)}try{await r(j,this).config.onSettled?.(void 0,o,this.state.variables,this.state.context,this,s)}catch(u){Promise.reject(u)}try{await this.options.onSettled?.(void 0,o,e,this.state.context,s)}catch(u){Promise.reject(u)}throw k(ue,this,me).call(this,{type:"error",error:o}),o}finally{r(Ve,this)===n&&g(Ve,this,void 0),r(j,this).runNext(this)}}};function me(e){const t=s=>{switch(e.type){case"failed":return{...s,failureCount:e.failureCount,failureReason:e.error};case"pause":return{...s,isPaused:!0};case"continue":return{...s,isPaused:!1};case"pending":return{...s,context:e.context,data:void 0,failureCount:0,failureReason:null,error:null,isPaused:e.isPaused,status:"pending",variables:e.variables,submittedAt:Date.now()};case"success":return{...s,data:e.data,failureCount:0,failureReason:null,error:null,status:"success",isPaused:!1};case"error":return{...s,data:void 0,error:e.error,failureCount:s.failureCount+1,failureReason:e.error,isPaused:!1,status:"error"}}};this.state=t(this.state),U.batch(()=>{r(oe,this).forEach(s=>{s.onMutationUpdate(e)}),r(j,this).notify({mutation:this,type:"updated",action:e})})}function Pn(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0,submittedAt:0}}var ye=new WeakMap,se=new WeakMap,xt=new WeakMap,Ci=class extends Ce{constructor(e={}){super(),x(this,ye,void 0),x(this,se,void 0),x(this,xt,void 0),this.config=e,g(ye,this,new Set),g(se,this,new Map),g(xt,this,0)}build(e,t,s){var n;const i=new Mi({client:e,mutationCache:this,mutationId:g(xt,this,(n=r(xt,this),++n)),options:e.defaultMutationOptions(t),state:s});return this.add(i),i}add(e){r(ye,this).add(e);const t=wt(e);if(typeof t=="string"){const s=r(se,this).get(t);s?s.push(e):r(se,this).set(t,[e])}this.notify({type:"added",mutation:e})}remove(e){if(r(ye,this).delete(e)){const t=wt(e);if(typeof t=="string"){const s=r(se,this).get(t);if(s)if(s.length>1){const n=s.indexOf(e);n!==-1&&s.splice(n,1)}else s[0]===e&&r(se,this).delete(t)}}this.notify({type:"removed",mutation:e})}canRun(e){const t=wt(e);if(typeof t=="string"){const s=r(se,this).get(t)?.find(n=>n.state.status==="pending");return!s||s===e}else return!0}runNext(e){const t=wt(e);return typeof t=="string"?r(se,this).get(t)?.find(s=>s!==e&&s.state.isPaused)?.continue()??Promise.resolve():Promise.resolve()}clear(){U.batch(()=>{r(ye,this).forEach(e=>{this.notify({type:"removed",mutation:e})}),r(ye,this).clear(),r(se,this).clear()})}getAll(){return Array.from(r(ye,this))}find(e){const t={exact:!0,...e};return this.getAll().find(s=>sn(t,s))}findAll(e={}){return this.getAll().filter(t=>sn(e,t))}notify(e){U.batch(()=>{this.listeners.forEach(t=>{t(e)})})}resumePausedMutations(){const e=this.getAll().filter(t=>t.state.isPaused);return U.batch(()=>Promise.all(e.map(t=>t.continue().catch(B))))}};function wt(e){return e.options.scope?.id}var be=new WeakMap,Re=new WeakMap,q=new WeakMap,xe=new WeakMap,we=new WeakSet,Oi=class extends Ce{constructor(e,t){super(),ft(this,we),x(this,be,void 0),x(this,Re,void 0),x(this,q,void 0),x(this,xe,void 0),g(be,this,e),this.setOptions(t),this.bindMethods(),k(we,this,kt).call(this)}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(e){const t=this.options;this.options=r(be,this).defaultMutationOptions(e),ut(this.options,t)||r(be,this).getMutationCache().notify({type:"observerOptionsUpdated",mutation:r(q,this),observer:this}),t?.mutationKey&&this.options.mutationKey&&ge(t.mutationKey)!==ge(this.options.mutationKey)?this.reset():r(q,this)?.state.status==="pending"&&r(q,this).setOptions(this.options)}onSubscribe(){this.listeners.size===1&&r(q,this)&&(r(q,this).addObserver(this),k(we,this,kt).call(this))}onUnsubscribe(){this.hasListeners()||r(q,this)?.removeObserver(this)}onMutationUpdate(e){k(we,this,kt).call(this),k(we,this,Mn).call(this,e)}getCurrentResult(){return r(Re,this)}reset(){r(q,this)?.removeObserver(this),g(q,this,void 0),k(we,this,kt).call(this),k(we,this,Mn).call(this)}mutate(e,t){return g(xe,this,t),r(q,this)?.removeObserver(this),g(q,this,r(be,this).getMutationCache().build(r(be,this),this.options)),r(q,this).addObserver(this),r(q,this).execute(e)}};function kt(){const e=r(q,this)?.state??Pn();g(Re,this,{...e,isPending:e.status==="pending",isSuccess:e.status==="success",isError:e.status==="error",isIdle:e.status==="idle",mutate:this.mutate,reset:this.reset})}function Mn(e){U.batch(()=>{if(r(xe,this)&&this.hasListeners()){const t=r(Re,this).variables,s=r(Re,this).context,n={client:r(be,this),meta:this.options.meta,mutationKey:this.options.mutationKey};if(e?.type==="success"){try{r(xe,this).onSuccess?.(e.data,t,s,n)}catch(i){Promise.reject(i)}try{r(xe,this).onSettled?.(e.data,null,t,s,n)}catch(i){Promise.reject(i)}}else if(e?.type==="error"){try{r(xe,this).onError?.(e.error,t,s,n)}catch(i){Promise.reject(i)}try{r(xe,this).onSettled?.(void 0,e.error,t,s,n)}catch(i){Promise.reject(i)}}}this.listeners.forEach(t=>{t(r(Re,this))})})}var ce=new WeakMap,Fi=class extends Ce{constructor(e={}){super(),x(this,ce,void 0),this.config=e,g(ce,this,new Map)}build(e,t,s){const n=t.queryKey,i=t.queryHash??qt(n,t);let a=this.get(i);return a||(a=new wi({client:e,queryKey:n,queryHash:i,options:e.defaultQueryOptions(t),state:s,defaultOptions:e.getQueryDefaults(n)}),this.add(a)),a}add(e){r(ce,this).has(e.queryHash)||(r(ce,this).set(e.queryHash,e),this.notify({type:"added",query:e}))}remove(e){r(ce,this).get(e.queryHash)===e&&(e.destroy(),r(ce,this).delete(e.queryHash),this.notify({type:"removed",query:e}))}clear(){U.batch(()=>{this.getAll().forEach(e=>{this.remove(e)})})}get(e){return r(ce,this).get(e)}getAll(){return[...r(ce,this).values()]}find(e){const t={exact:!0,...e};return this.getAll().find(s=>tn(t,s))}findAll(e={}){const t=this.getAll();return Object.keys(e).length>0?t.filter(s=>tn(e,s)):t}notify(e){U.batch(()=>{this.listeners.forEach(t=>{t(e)})})}onFocus(){U.batch(()=>{this.getAll().forEach(e=>{e.onFocus()})})}onOnline(){U.batch(()=>{this.getAll().forEach(e=>{e.onOnline()})})}},W=new WeakMap,Te=new WeakMap,$e=new WeakMap,St=new WeakMap,Pt=new WeakMap,le=new WeakMap,Mt=new WeakMap,Ct=new WeakMap,Ii=class{constructor(e={}){x(this,W,void 0),x(this,Te,void 0),x(this,$e,void 0),x(this,St,void 0),x(this,Pt,void 0),x(this,le,void 0),x(this,Mt,void 0),x(this,Ct,void 0),g(W,this,e.queryCache||new Fi),g(Te,this,e.mutationCache||new Ci),g($e,this,e.defaultOptions||{}),g(St,this,new Map),g(Pt,this,new Map),g(le,this,0)}mount(){var e;g(le,this,(e=r(le,this),e++,e)),r(le,this)===1&&(g(Mt,this,Jt.subscribe(async t=>{t&&(await this.resumePausedMutations(),r(W,this).onFocus())})),g(Ct,this,dt.subscribe(async t=>{t&&(await this.resumePausedMutations(),r(W,this).onOnline())})))}unmount(){var e;g(le,this,(e=r(le,this),e--,e)),r(le,this)===0&&(r(Mt,this)?.call(this),g(Mt,this,void 0),r(Ct,this)?.call(this),g(Ct,this,void 0))}isFetching(e){return r(W,this).findAll({...e,fetchStatus:"fetching"}).length}isMutating(e){return r(Te,this).findAll({...e,status:"pending"}).length}getQueryData(e){const t=this.defaultQueryOptions({queryKey:e});return r(W,this).get(t.queryHash)?.state.data}ensureQueryData(e){const t=this.defaultQueryOptions(e),s=r(W,this).build(this,t),n=s.state.data;return n===void 0?this.fetchQuery(e):(e.revalidateIfStale&&s.isStaleByTime(R(t.staleTime,s))&&this.prefetchQuery(t),Promise.resolve(n))}getQueriesData(e){return r(W,this).findAll(e).map(({queryKey:t,state:s})=>[t,s.data])}setQueryData(e,t,s){const n=this.defaultQueryOptions({queryKey:e}),i=r(W,this).get(n.queryHash)?.state.data,a=oi(t,i);if(a!==void 0)return r(W,this).build(this,n).setData(a,{...s,manual:!0})}setQueriesData(e,t,s){return U.batch(()=>r(W,this).findAll(e).map(({queryKey:n})=>[n,this.setQueryData(n,t,s)]))}getQueryState(e){const t=this.defaultQueryOptions({queryKey:e});return r(W,this).get(t.queryHash)?.state}removeQueries(e){const t=r(W,this);U.batch(()=>{t.findAll(e).forEach(s=>{t.remove(s)})})}resetQueries(e,t){const s=r(W,this);return U.batch(()=>{const n=s.findAll(e),i=new Set(n);return n.forEach(a=>{a.reset()}),this.refetchQueries({type:"active",predicate:a=>i.has(a)},t)})}cancelQueries(e,t={}){const s={revert:!0,...t},n=U.batch(()=>r(W,this).findAll(e).map(i=>i.cancel(s)));return Promise.all(n).then(B).catch(B)}invalidateQueries(e,t={}){return U.batch(()=>(r(W,this).findAll(e).forEach(s=>{s.invalidate()}),e?.refetchType==="none"?Promise.resolve():this.refetchQueries({...e,type:e?.refetchType??e?.type??"active"},t)))}refetchQueries(e,t={}){const s={...t,cancelRefetch:t.cancelRefetch??!0},n=U.batch(()=>r(W,this).findAll(e).filter(i=>!i.isDisabled()&&!i.isStatic()).map(i=>{let a=i.fetch(void 0,s);return s.throwOnError||(a=a.catch(B)),i.state.fetchStatus==="paused"?Promise.resolve():a}));return Promise.all(n).then(B)}async query(e){const t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);const s=r(W,this).build(this,t),n=s.isStaleByTime(R(t.staleTime,s))?await s.fetch(t):s.state.data,i=t.select;return i?i(n):n}fetchQuery(e){const t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);const s=r(W,this).build(this,t);return s.isStaleByTime(R(t.staleTime,s))?s.fetch(t):Promise.resolve(s.state.data)}prefetchQuery(e){return this.fetchQuery(e).then(B).catch(B)}infiniteQuery(e){return e._type="infinite",this.query(e)}fetchInfiniteQuery(e){return e._type="infinite",this.fetchQuery(e)}prefetchInfiniteQuery(e){return this.fetchInfiniteQuery(e).then(B).catch(B)}ensureInfiniteQueryData(e){return e._type="infinite",this.ensureQueryData(e)}resumePausedMutations(){return dt.isOnline()?r(Te,this).resumePausedMutations():Promise.resolve()}getQueryCache(){return r(W,this)}getMutationCache(){return r(Te,this)}getDefaultOptions(){return r($e,this)}setDefaultOptions(e){g($e,this,e)}setQueryDefaults(e,t){r(St,this).set(ge(e),{queryKey:e,defaultOptions:t})}getQueryDefaults(e){const t=[...r(St,this).values()],s={};return t.forEach(n=>{Me(e,n.queryKey)&&Object.assign(s,n.defaultOptions)}),s}setMutationDefaults(e,t){r(Pt,this).set(ge(e),{mutationKey:e,defaultOptions:t})}getMutationDefaults(e){const t=[...r(Pt,this).values()],s={};return t.forEach(n=>{Me(e,n.mutationKey)&&Object.assign(s,n.defaultOptions)}),s}defaultQueryOptions(e){if(e._defaulted)return e;const t={...r($e,this).queries,...this.getQueryDefaults(e.queryKey),...e,_defaulted:!0};return t.queryHash||(t.queryHash=qt(t.queryKey,t)),t.refetchOnReconnect===void 0&&(t.refetchOnReconnect=t.networkMode!=="always"),t.throwOnError===void 0&&(t.throwOnError=!!t.suspense),!t.networkMode&&t.persister&&(t.networkMode="offlineFirst"),t.queryFn===zt&&(t.enabled=!1),t}defaultMutationOptions(e){return e?._defaulted?e:{...r($e,this).mutations,...e?.mutationKey&&this.getMutationDefaults(e.mutationKey),...e,_defaulted:!0}}clear(){r(W,this).clear(),r(Te,this).clear()}},Cn=Wt(!1),Ri=()=>Qt(Cn),hr=Cn.Provider;function Ti(){let e=!1;return{clearReset:()=>{e=!1},reset:()=>{e=!0},isReset:()=>e}}var $i=Wt(Ti()),Ei=()=>Qt($i),Ai=(e,t,s)=>{const n=s?.state.error&&typeof e.throwOnError=="function"?Gt(e.throwOnError,[s.state.error,s]):e.throwOnError;(e.suspense||n)&&(t.isReset()||(e.retryOnMount=!1))},Wi=e=>{ee(()=>{e.clearReset()},[e])},Ni=({result:e,errorResetBoundary:t,throwOnError:s,query:n,suspense:i})=>e.isError&&!t.isReset()&&!e.isFetching&&n&&(i&&e.data===void 0||Gt(s,[e.error,n])),Qi=e=>{if(e.suspense){const s=i=>i==="static"?i:Math.max(i??1e3,1e3),n=e.staleTime;e.staleTime=typeof n=="function"?(...i)=>s(n(...i)):s(n),typeof e.gcTime=="number"&&(e.gcTime=Math.max(e.gcTime,1e3))}},Ui=(e,t)=>e?.suspense&&t.isPending,Di=(e,t,s)=>t.fetchOptimistic(e).catch(()=>{s.clearReset()});function Li(e,t,s){const n=Ri(),i=Ei(),a=jt(s),o=a.defaultQueryOptions(e),u=a.getQueryCache().get(o.queryHash),h=e.subscribed!==!1;o._optimisticResults=n?"isRestoring":h?"optimistic":void 0,Qi(o),Ai(o,i,u),Wi(i);const[c]=X(()=>new t(a,o)),p=c.getOptimisticResult(o),d=!n&&h;if(Ns(fe(l=>{const f=d?c.subscribe(U.batchCalls(l)):B;return c.updateResult(),f},[c,d]),()=>c.getCurrentResult(),()=>c.getCurrentResult()),ee(()=>{c.setOptions(o)},[o,c]),Ui(o,p))throw Di(o,c,i);if(Ni({result:p,errorResetBoundary:i,throwOnError:o.throwOnError,query:u,suspense:o.suspense}))throw p.error;return o.notifyOnChangeProps?p:c.trackResult(p)}function Bi(e,t){const s=jt(t),[n]=X(()=>new Oi(s,e));ee(()=>{n.setOptions(e)},[n,e]);const i=Ns(fe(o=>n.subscribe(U.batchCalls(o)),[n]),()=>n.getCurrentResult(),()=>n.getCurrentResult()),a=fe((...o)=>{n.mutate(o[0],o[1]).catch(B)},[n]);if(i.error&&Gt(n.options.throwOnError,[i.error]))throw i.error;return{...i,mutate:a,mutateAsync:i.mutate}}function ji(e,t){return Li(e,Pi,t)}function rs(e,t){return`schedulux_sess_${e}_${t}`}function as(e,t){try{const s=sessionStorage.getItem(rs(e,t));return s?JSON.parse(s):null}catch{return null}}function On(e,t,s){try{sessionStorage.setItem(rs(e,t),JSON.stringify(s))}catch{}}function qi(e,t){try{sessionStorage.removeItem(rs(e,t))}catch{}}async function Fn(e,t,s,n="live"){const i=as(t,s),a=e.replace(/\/+$/,""),o=n==="sandbox"?`${a}/api/v1/tenant/knowledge/onboarding/sandbox/init`:`${a}/api/v1/public/chat/init`,u={tenant_id:t,agent_id:s};i?.sessionId&&(u.session_id=i.sessionId),i?.token&&(u.token=i.token);const h=await fetch(o,{method:"POST",headers:{"Content-Type":"application/json"},credentials:n==="sandbox"?"include":"same-origin",body:JSON.stringify(u)});if(!h.ok)throw new Error(`Init failed with status: ${h.status}`);const c=(await h.json()).data||{};On(t,s,{sessionId:c.session_id,token:c.token});const p=(c.messages||[]).map((d,l)=>({id:`init_${l}`,role:d.role==="user"?"user":"agent",content:d.content||d.text||"",created_at:d.created_at||new Date().toISOString()}));return{sessionId:c.session_id,token:c.token,isFirstTime:!!c.is_first_time,messages:p}}async function Hi(e,t,s,n,i,a,o,u,h="live"){const c=e.replace(/\/+$/,""),p=h==="sandbox"?`${c}/api/v1/tenant/knowledge/onboarding/sandbox`:`${c}/api/v1/public/chat`,d={tenant_id:t,agent_id:s,session_id:n,token:i,message:a};o&&(d.customer_name=o),u&&(d.customer_phone=u);const l=await fetch(p,{method:"POST",headers:{"Content-Type":"application/json"},credentials:h==="sandbox"?"include":"same-origin",body:JSON.stringify(d)});if(!l.ok){const v=await l.text().catch(()=>"");throw new Error(`Message failed (${l.status}): ${v||l.statusText}`)}const f=(await l.json()).data||{};return f.token&&On(t,s,{sessionId:f.session_id||n,token:f.token}),{response:f.response||f.reply||"",sessionId:f.session_id||n,token:f.token||i,user_message_id:f.user_message_id||void 0,agent_message_id:f.agent_message_id||void 0,created_at:f.created_at||void 0,booking_id:f.booking_id||void 0,booking_reference:f.booking_reference||void 0,status:f.status||void 0}}async function Ki(e,t,s,n="live"){const i=e.replace(/\/+$/,""),a=n==="sandbox"?`${i}/api/v1/tenant/knowledge/onboarding/sandbox/config?tenant_id=${encodeURIComponent(t)}&agent_id=${encodeURIComponent(s)}`:`${i}/api/v1/public/chat/config?tenant_id=${encodeURIComponent(t)}&agent_id=${encodeURIComponent(s)}`,o=await fetch(a,{method:"GET",headers:{Accept:"application/json"},credentials:n==="sandbox"?"include":"same-origin"});if(!o.ok)throw new Error(`Widget config fetch failed (${o.status}): ${o.statusText}`);return(await o.json()).data?.widget_config||{}}async function zi({apiBase:e,tenantId:t,agentId:s,sessionId:n,token:i,before:a,limit:o=20,mode:u="live"}){const h=e.replace(/\/+$/,""),c=new URLSearchParams;c.append("tenant_id",t),c.append("agent_id",s),n&&c.append("session_id",n),i&&c.append("token",i),a&&c.append("before",a),c.append("limit",String(o));const p=u==="sandbox"?`${h}/api/v1/tenant/knowledge/onboarding/sandbox/messages?${c.toString()}`:`${h}/api/v1/public/chat/messages?${c.toString()}`,d=await fetch(p,{method:"GET",headers:{Accept:"application/json"},credentials:u==="sandbox"?"include":"same-origin"});if(!d.ok){const f=await d.text().catch(()=>"");throw new Error(`Fetch messages failed (${d.status}): ${f||d.statusText}`)}const l=(await d.json()).data||{};return{messages:(l.messages||[]).map((f,v)=>({id:f.id||f.message_id||`msg_${Date.now()}_${v}`,role:f.role==="user"?"user":"agent",content:f.content||f.text||"",created_at:f.created_at||new Date().toISOString(),booking_id:f.booking_id,booking_reference:f.booking_reference,status:f.status})),next_cursor:l.next_cursor||null,has_more:!!l.has_more}}var os={all:["schedulux-widget"],messages:(e,t,s,n)=>[...os.all,"messages",e,t,s,n??""]};function Gi({options:e,config:t}){const s=jt(),[n,i]=X(()=>as(e.tenantId,e.agentId)?.sessionId||""),[a,o]=X(()=>as(e.tenantId,e.agentId)?.token),[u,h]=X(!1),[c,p]=X(!1),d=t.initial_greeting||"Hi there! How can I assist you with scheduling today?",l=e.mode||"live",f=rt(()=>os.messages(l,e.tenantId,e.agentId,n),[l,e.tenantId,e.agentId,n]);ee(()=>{let b=!1;return(async()=>{h(!0);try{const Q=await Fn(e.apiBase||"",e.tenantId,e.agentId,l);b||(i(Q.sessionId),o(Q.token))}catch(Q){console.warn("[Schedulux Widget] Session init fallback:",Q)}finally{b||h(!1)}})(),()=>{b=!0}},[e.apiBase,e.tenantId,e.agentId,l]);const{data:v,fetchPreviousPage:w,hasPreviousPage:m,isFetchingPreviousPage:P,isLoading:y}=ji({queryKey:f,queryFn:async({pageParam:b})=>n?zi({apiBase:e.apiBase||"",tenantId:e.tenantId,agentId:e.agentId,sessionId:n,token:a,before:b,limit:20,mode:l}):{messages:[],next_cursor:null,has_more:!1},initialPageParam:void 0,getPreviousPageParam:b=>b.has_more&&b.next_cursor?b.next_cursor:void 0,getNextPageParam:()=>{},enabled:!!n,staleTime:3e5,refetchOnWindowFocus:!1}),F=rt(()=>{const b=v?.pages?v.pages.flatMap(C=>C.messages):[];if(b.length===0)return[{id:"welcome",role:"agent",content:d,created_at:new Date().toISOString()}];const N=new Set,Q=[];for(const C of b){if(C.id){if(N.has(C.id))continue;N.add(C.id)}Q.push(C)}return Q},[v?.pages,d]),$=Bi({mutationFn:async b=>{if(e.onSendMessage){const N=await e.onSendMessage(b);return{response:N.response,sessionId:n,token:a,booking_id:N.booking_id,booking_reference:N.booking_reference,status:N.status}}return Hi(e.apiBase||"",e.tenantId,e.agentId,n,a,b,e.customerName,e.customerPhone,l)},onMutate:async b=>{p(!0);const N=`temp_${Date.now()}`,Q={id:N,role:"user",content:b,created_at:new Date().toISOString(),delivery_status:"pending"};return s.setQueryData(f,C=>{if(!C||C.pages.length===0)return{pageParams:[void 0],pages:[{messages:[Q],next_cursor:null,has_more:!1}]};const H=C.pages.length-1,T={...C.pages[H],messages:[...C.pages[H].messages,Q]},V=[...C.pages];return V[H]=T,{...C,pages:V}}),{tempId:N}},onSuccess:(b,N,Q)=>{const C=!!(b.sessionId&&b.sessionId!==n);C&&b.sessionId&&i(b.sessionId),b.token&&o(b.token);const H=b.response||"I would be happy to help you with that!",T={id:b.agent_message_id||`agent_${Date.now()}`,role:"agent",content:H,created_at:b.created_at||new Date().toISOString(),booking_id:b.booking_id,booking_reference:b.booking_reference,status:b.status,delivery_status:"sent"},V=G=>{if(!G||G.pages.length===0)return{pageParams:[void 0],pages:[{messages:[T],next_cursor:null,has_more:!1}]};const ne=G.pages.length-1,Je=G.pages[ne],ke=Je.messages.map(ie=>Q?.tempId&&ie.id===Q.tempId?{...ie,id:b.user_message_id||ie.id,delivery_status:"sent"}:ie);ke.some(ie=>ie.id===T.id||ie.role==="agent"&&ie.content===T.content&&Math.abs(new Date(ie.created_at||0).getTime()-new Date(T.created_at||0).getTime())<3e3)||ke.push(T);const ur={...Je,messages:ke},En=[...G.pages];return En[ne]=ur,{...G,pages:En}};if(C&&b.sessionId){const G=os.messages(l,e.tenantId,e.agentId,b.sessionId),ne=s.getQueryData(f);s.setQueryData(G,V(ne))}else s.setQueryData(f,V);b.booking_reference&&e.onBookingConfirmed?.({booking_id:b.booking_id,booking_reference:b.booking_reference,status:b.status})},onError:(b,N,Q)=>{console.error("[Schedulux Widget] Message error:",b),s.setQueryData(f,T=>{if(!T||T.pages.length===0)return T;const V=T.pages.length-1,G=T.pages[V],ne=G.messages.map(ke=>Q?.tempId&&ke.id===Q.tempId?{...ke,delivery_status:"error"}:ke),Je=[...T.pages];return Je[V]={...G,messages:ne},{...T,pages:Je}});const C=t.fallback_message||"I apologize, but I am having trouble connecting to the booking server. Please try again shortly or contact support.",H={id:`err_${Date.now()}`,role:"agent",content:C,created_at:new Date().toISOString(),delivery_status:"error"};s.setQueryData(f,T=>{if(!T||T.pages.length===0)return T;const V=T.pages.length-1,G={...T.pages[V],messages:[...T.pages[V].messages,H]},ne=[...T.pages];return ne[V]=G,{...T,pages:ne}})},onSettled:()=>{p(!1)}}),O=fe(async b=>{!b.trim()||c||!n||await $.mutateAsync(b.trim())},[c,n,$]),L=fe(async()=>{qi(e.tenantId,e.agentId),s.removeQueries({queryKey:f}),i(""),o(void 0),h(!0);try{const b=await Fn(e.apiBase||"",e.tenantId,e.agentId,l);i(b.sessionId),o(b.token)}finally{h(!1)}e.onReset?.()},[e.tenantId,e.agentId,e.apiBase,l,s,f,e.onReset]);return{messages:F,isTyping:c,isLoadingMessages:y,isInitializing:u,hasOlderMessages:!!m,isFetchingOlderMessages:P,loadOlderMessages:w,sendMessage:O,resetSession:L}}function Vi({className:e="",size:t=20}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:_("path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z"})})}function Ji({className:e="",size:t=20}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"M8 2v4"}),_("path",{d:"M16 2v4"}),_("rect",{width:"18",height:"18",x:"3",y:"4",rx:"2"}),_("path",{d:"M3 10h18"})]})}function Yi({className:e="",size:t=20}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("circle",{cx:"12",cy:"12",r:"10"}),_("path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"}),_("path",{d:"M12 17h.01"})]})}function Zi({className:e="",size:t=18}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"m22 2-7 20-4-9-9-4Z"}),_("path",{d:"M22 2 11 13"})]})}function In({className:e="",size:t=18}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"M18 6 6 18"}),_("path",{d:"m6 6 12 12"})]})}function Xi({className:e="",size:t=16}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}),_("path",{d:"M21 3v5h-5"}),_("path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}),_("path",{d:"M8 16H3v5"})]})}function er({className:e="",size:t=18}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("circle",{cx:"12",cy:"12",r:"10"}),_("path",{d:"m9 12 2 2 4-4"})]})}function tr({className:e="",size:t=18}){return _("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[_("path",{d:"M12 8V4H8"}),_("rect",{width:"16",height:"12",x:"4",y:"8",rx:"2"}),_("path",{d:"M2 14h2"}),_("path",{d:"M20 14h2"}),_("path",{d:"M15 13v2"}),_("path",{d:"M9 13v2"})]})}function sr(e){if(!e)return"";try{const t=new Date(e);return Number.isNaN(t.getTime())?"":t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}catch{return""}}function nr({message:e}){const t=e.role==="user",s=e.delivery_status==="pending",n=sr(e.created_at);return _("div",{className:`schedulux-msg-row ${t?"user":"agent"} ${s?"is-pending":""}`,style:s?{opacity:.72}:void 0,children:[_("div",{className:"schedulux-bubble",children:[e.content,e.booking_reference&&_("div",{className:"schedulux-booking-card",children:[_("div",{className:"schedulux-booking-header",children:[_(er,{size:16}),_("span",{children:"Appointment Confirmed"})]}),_("div",{className:"schedulux-booking-ref",children:["Ref: ",e.booking_reference]})]})]}),_("div",{className:"schedulux-msg-time",children:[n,s&&" • sending..."]})]})}function ir({messages:e,isTyping:t,quickPrompts:s=[],onSelectPrompt:n,hasOlderMessages:i=!1,isLoadingOlder:a=!1,onLoadOlder:o}){const u=Pe(null),h=Pe(null),c=Pe(e.length),p=Pe(0),d=Pe(!1);ee(()=>{const w=c.current,m=e.length;if(c.current=m,d.current&&u.current){const P=u.current.scrollHeight-p.current;u.current.scrollTop+=P,d.current=!1;return}(m>w||t)&&h.current?.scrollIntoView({behavior:"smooth"})},[e,t]);const l=w=>{const m=w.currentTarget;m.scrollTop<=20&&i&&!a&&o&&(d.current=!0,p.current=m.scrollHeight,o())},f=()=>{u.current&&i&&!a&&o&&(d.current=!0,p.current=u.current.scrollHeight,o())},v=s.length>0&&e.length<=2;return _("div",{ref:u,className:"schedulux-messages",onScroll:l,children:[i&&_("div",{className:"schedulux-load-older",children:a?_("span",{className:"schedulux-loading-older-text",children:"Loading earlier messages..."}):_("button",{type:"button",onClick:f,className:"schedulux-load-older-btn",children:"Load earlier messages"})}),e.map((w,m)=>_(nr,{message:w},w.id||`msg_${m}`)),v&&_("div",{className:"schedulux-quick-prompts",children:s.map(w=>_("button",{type:"button",className:"schedulux-prompt-chip",onClick:()=>n(w),children:w},w))}),t&&_("div",{className:"schedulux-typing",children:[_("span",{className:"schedulux-typing-dot"}),_("span",{className:"schedulux-typing-dot"}),_("span",{className:"schedulux-typing-dot"})]}),_("div",{ref:h,style:{height:1}})]})}function rr({config:e,onClose:t,onReset:s,inline:n=!1}){const i=e.agent_name||"AI Assistant",a=e.agent_subtitle||"Typically replies instantly",o=e.avatar_url||e.logo_url;return _("div",{className:"schedulux-header",children:[_("div",{className:"schedulux-header-brand",children:[_("div",{className:"schedulux-avatar",children:o?_("img",{src:o,alt:i}):_(tr,{className:"schedulux-avatar-icon",size:20})}),_("div",{className:"schedulux-header-titles",children:[_("div",{className:"schedulux-title-row",children:[_("span",{className:"schedulux-header-title",children:i}),_("span",{className:"schedulux-status-dot",title:"Live Agent Active"})]}),_("span",{className:"schedulux-header-subtitle",children:a})]})]}),_("div",{className:"schedulux-header-actions",children:[_("button",{type:"button",onClick:s,className:"schedulux-header-btn",title:"Reset conversation","aria-label":"Reset conversation",children:_(Xi,{size:15})}),!n&&t&&_("button",{type:"button",onClick:t,className:"schedulux-header-btn",title:"Minimize chat","aria-label":"Minimize chat",children:_(In,{size:16})})]})]})}function ar({input:e,setInput:t,onSend:s,disabled:n,placeholder:i="Type a message or ask a question..."}){const a=Pe(null),o=p=>{if(p.key==="Enter"&&!p.shiftKey){p.preventDefault();const d=e.trim();d&&!n&&(s(d),t(""),a.current&&(a.current.style.height="auto"))}},u=p=>{const d=p.target.value;t(d),a.current&&(a.current.style.height="auto",a.current.style.height=`${Math.min(a.current.scrollHeight,80)}px`)},h=()=>{const p=e.trim();p&&!n&&(s(p),t(""),a.current&&(a.current.style.height="auto"))},c=!!e.trim()&&!n;return _("div",{className:"schedulux-footer",children:[_("div",{className:"schedulux-input-box",children:[_("textarea",{ref:a,rows:1,value:e,onInput:u,onKeyDown:o,placeholder:i,disabled:n,className:"schedulux-textarea","aria-label":"Chat input message"}),_("button",{type:"button",onClick:h,disabled:!c,className:"schedulux-send-btn",title:"Send message","aria-label":"Send message",children:_(Zi,{size:16})})]}),_("div",{className:"schedulux-powered-by",children:["Powered by"," ",_("a",{href:"https://schedulux.ai",target:"_blank",rel:"noopener noreferrer",children:"Schedulux AI"})]})]})}function or({config:e,isOpen:t,onToggle:s}){const n=e.launcher_style||"bubble",i=e.launcher_icon||"chat",a=()=>{if(t)return _(In,{size:22});switch(i){case"calendar":return _(Ji,{size:22});case"help":return _(Yi,{size:22});default:return _(Vi,{size:22})}},o=e.launcher_style==="pill"||e.launcher_style==="bar"?t?"Close":"Book with AI":null;return _("button",{type:"button",onClick:s,className:`schedulux-launcher style-${n}`,"aria-label":t?"Close chat":"Open chat",children:[a(),o&&_("span",{children:o}),!t&&_("span",{className:"schedulux-launcher-badge"})]})}function Rn(){try{const e=window.AudioContext||window.webkitAudioContext;if(!e)return;const t=new e,s=t.createOscillator(),n=t.createGain();s.type="sine",s.frequency.setValueAtTime(587.33,t.currentTime),s.frequency.exponentialRampToValueAtTime(880,t.currentTime+.15),n.gain.setValueAtTime(.08,t.currentTime),n.gain.exponentialRampToValueAtTime(.001,t.currentTime+.35),s.connect(n),n.connect(t.destination),s.start(),s.stop(t.currentTime+.35)}catch{}}function Tn({options:e,config:t}){const[s,n]=X(!!e.inline),[i,a]=X(""),{messages:o,isTyping:u,hasOlderMessages:h,isFetchingOlderMessages:c,loadOlderMessages:p,sendMessage:d,resetSession:l}=Gi({options:e,config:t}),f=t.quick_prompts||["What services do you provide?","Check available appointment times","What are your operating hours?"];ee(()=>{if(t.auto_expand_delay_seconds&&t.auto_expand_delay_seconds>0){const m=setTimeout(()=>{n(!0)},t.auto_expand_delay_seconds*1e3);return()=>clearTimeout(m)}},[t.auto_expand_delay_seconds]),ee(()=>{if(t.sound_on_load){const m=setTimeout(()=>{Rn()},500);return()=>clearTimeout(m)}},[t.sound_on_load]);const v=fe(()=>{n(m=>{const P=!m;return e.onToggle?.(P),P})},[e]),w=fe(async m=>{!m.trim()||u||(await d(m.trim()),Rn())},[u,d]);return _("div",{className:`schedulux-root ${e.inline?"is-inline":""}`,children:[_("div",{className:`schedulux-window ${s?"is-open":""}`,children:[_(rr,{config:t,onClose:()=>n(!1),onReset:l,inline:e.inline}),_(ir,{messages:o,isTyping:u,quickPrompts:f,onSelectPrompt:w,hasOlderMessages:h,isLoadingOlder:c,onLoadOlder:()=>p()}),_(ar,{input:i,setInput:a,onSend:w,disabled:u,placeholder:t.placeholder_text})]}),!e.inline&&_(or,{config:t,isOpen:s,onToggle:v})]})}function us(e,t){const s=e?.theme||{},n=s.primary_color||"#4F46E5",i=s.secondary_color||"#6366F1",a=s.background_color||"#FFFFFF",o=s.header_background||n,u=s.header_text_color||"#FFFFFF",h=s.user_bubble_bg||n,c=s.user_bubble_text||"#FFFFFF",p=s.agent_bubble_bg||"#F3F4F6",d=s.agent_bubble_text||"#111827",l=s.border_radius||"16px",f=s.font_family&&s.font_family!=="inherit"?s.font_family:'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',v=e?.bottom_spacing_px??20,w=e?.side_spacing_px??20,m=e?.position||"bottom-right",P=m.includes("left"),y=m.includes("top");return`
    :host {
      display: ${t?"block":"contents"};
      width: 100%;
      height: 100%;
      min-height: 0;
      --schedulux-primary: ${n};
      --schedulux-secondary: ${i};
      --schedulux-bg: ${a};
      --schedulux-header-bg: ${o};
      --schedulux-header-text: ${u};
      --schedulux-user-bubble-bg: ${h};
      --schedulux-user-bubble-text: ${c};
      --schedulux-agent-bubble-bg: ${p};
      --schedulux-agent-bubble-text: ${d};
      --schedulux-radius: ${l};
      --schedulux-font: ${f};
      --schedulux-pos-bottom: ${v}px;
      --schedulux-pos-side: ${w}px;
      --schedulux-shadow: 0 12px 36px -4px rgba(0, 0, 0, 0.16), 0 4px 12px -2px rgba(0, 0, 0, 0.08);
      --schedulux-border: rgba(226, 232, 240, 0.8);
      font-family: var(--schedulux-font);
      box-sizing: border-box;
      -webkit-font-smoothing: antialiased;
      line-height: 1.5;
    }

    .schedulux-mount-root {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      min-height: 0;
      flex: 1 1 0%;
      overflow: hidden;
    }

    *, *::before, *::after {
      box-sizing: inherit;
      margin: 0;
      padding: 0;
    }

    .schedulux-root {
      position: ${t?"relative":"fixed"};
      ${t?"width: 100%; height: 100%; top: auto; bottom: auto; left: auto; right: auto;":y?"top: var(--schedulux-pos-bottom);":"bottom: var(--schedulux-pos-bottom);"}
      ${t?"":P?"left: var(--schedulux-pos-side);":"right: var(--schedulux-pos-side);"}
      z-index: ${t?"1":"2147483647"};
      display: flex;
      flex-direction: column;
      min-height: 0;
      ${t?"align-items: stretch;":P?"align-items: flex-start;":"align-items: flex-end;"}
      pointer-events: ${t?"auto":"none"};
    }

    .schedulux-root.is-inline {
      position: relative !important;
      width: 100% !important;
      height: 100% !important;
      min-height: 0 !important;
      top: auto !important;
      bottom: auto !important;
      left: auto !important;
      right: auto !important;
      align-items: stretch !important;
      pointer-events: auto !important;
      flex: 1 1 0% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    .schedulux-root.is-inline .schedulux-window {
      width: 100% !important;
      max-width: 100% !important;
      height: 100% !important;
      max-height: 100% !important;
      min-height: 0 !important;
      margin-bottom: 0 !important;
      box-shadow: none !important;
      border: 1px solid var(--schedulux-border) !important;
      border-radius: var(--schedulux-radius) !important;
      opacity: 1 !important;
      transform: none !important;
      visibility: visible !important;
      flex: 1 1 0% !important;
      display: flex !important;
      flex-direction: column !important;
      overflow: hidden !important;
    }

    .schedulux-root.is-inline .schedulux-launcher {
      display: none !important;
    }

    .schedulux-root * {
      pointer-events: auto;
    }

    /* Floating Launcher Button */
    .schedulux-launcher {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: var(--schedulux-primary);
      color: #ffffff;
      border: none;
      border-radius: 9999px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      outline: none;
      user-select: none;
    }

    .schedulux-launcher:hover {
      transform: scale(1.05);
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.24);
      filter: brightness(1.06);
    }

    .schedulux-launcher:active {
      transform: scale(0.96);
    }

    .schedulux-launcher.style-bubble {
      width: 58px;
      height: 58px;
      padding: 0;
    }

    .schedulux-launcher.style-pill {
      height: 50px;
      padding: 0 20px;
      font-weight: 600;
      font-size: 14px;
    }

    .schedulux-launcher.style-bar {
      height: 44px;
      padding: 0 18px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 14px;
    }

    .schedulux-launcher-badge {
      position: absolute;
      top: -2px;
      right: -2px;
      width: 14px;
      height: 14px;
      background: #10B981;
      border: 2px solid #ffffff;
      border-radius: 50%;
    }

    /* Chat Window Container */
    .schedulux-window {
      position: relative;
      width: 380px;
      max-width: calc(100vw - 32px);
      height: 600px;
      max-height: calc(100vh - 100px);
      background: var(--schedulux-bg);
      border-radius: var(--schedulux-radius);
      box-shadow: var(--schedulux-shadow);
      border: 1px solid var(--schedulux-border);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 14px;
      opacity: 0;
      transform: translateY(16px) scale(0.96);
      transform-origin: ${P?"bottom left":"bottom right"};
      transition: opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1), transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
      visibility: hidden;
    }

    .schedulux-window.is-open {
      opacity: 1;
      transform: translateY(0) scale(1);
      visibility: visible;
    }

    /* Header */
    .schedulux-header {
      background: var(--schedulux-header-bg);
      color: var(--schedulux-header-text);
      padding: 14px 18px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top-left-radius: var(--schedulux-radius);
      border-top-right-radius: var(--schedulux-radius);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
    }

    .schedulux-header-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      min-width: 0;
    }

    .schedulux-avatar {
      width: 38px;
      height: 38px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      border: 1.5px solid rgba(255, 255, 255, 0.3);
    }

    .schedulux-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .schedulux-header-titles {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .schedulux-title-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .schedulux-header-title {
      font-weight: 700;
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .schedulux-status-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #10B981;
      display: inline-block;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
      animation: schedulux-pulse 2s infinite;
    }

    .schedulux-header-subtitle {
      font-size: 11px;
      opacity: 0.85;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .schedulux-header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .schedulux-header-btn {
      background: rgba(255, 255, 255, 0.15);
      border: none;
      color: var(--schedulux-header-text);
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: background 0.15s ease;
      outline: none;
    }

    .schedulux-header-btn:hover {
      background: rgba(255, 255, 255, 0.28);
    }

    /* Message Body / List */
    .schedulux-messages {
      flex: 1 1 0% !important;
      min-height: 0 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .schedulux-messages::-webkit-scrollbar {
      width: 5px;
    }
    .schedulux-messages::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.4);
      border-radius: 4px;
    }

    .schedulux-load-older {
      display: flex;
      justify-content: center;
      padding: 4px 0 8px 0;
      flex-shrink: 0;
    }

    .schedulux-load-older-btn {
      font-size: 11px;
      font-weight: 600;
      color: #64748B;
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      border-radius: 9999px;
      padding: 4px 12px;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .schedulux-load-older-btn:hover {
      background: #E2E8F0;
      color: #1E293B;
    }

    .schedulux-loading-older-text {
      font-size: 11px;
      color: #94A3B8;
      font-style: italic;
    }

    .schedulux-empty-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 24px 12px;
      color: #64748B;
      gap: 8px;
      margin: auto 0;
    }

    /* Bubbles */
    .schedulux-msg-row {
      display: flex;
      flex-direction: column;
      max-width: 85%;
      animation: schedulux-slide-up 0.2s ease-out;
    }

    .schedulux-msg-row.agent {
      align-self: flex-start;
    }

    .schedulux-msg-row.user {
      align-self: flex-end;
    }

    .schedulux-bubble {
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 13.5px;
      line-height: 1.45;
      word-break: break-word;
      white-space: pre-wrap;
    }

    .schedulux-msg-row.agent .schedulux-bubble {
      background: var(--schedulux-agent-bubble-bg);
      color: var(--schedulux-agent-bubble-text);
      border-bottom-left-radius: 3px;
    }

    .schedulux-msg-row.user .schedulux-bubble {
      background: var(--schedulux-user-bubble-bg);
      color: var(--schedulux-user-bubble-text);
      border-bottom-right-radius: 3px;
    }

    .schedulux-msg-time {
      font-size: 10px;
      color: #94A3B8;
      margin-top: 3px;
      padding: 0 4px;
    }
    .schedulux-msg-row.user .schedulux-msg-time {
      text-align: right;
    }

    /* Booking Confirmation Card */
    .schedulux-booking-card {
      margin-top: 8px;
      background: #ECFDF5;
      border: 1px solid #A7F3D0;
      border-radius: 12px;
      padding: 12px 14px;
      color: #065F46;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .schedulux-booking-header {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 13px;
    }

    .schedulux-booking-ref {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      background: rgba(6, 95, 70, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      width: fit-content;
      font-weight: 600;
    }

    /* Quick Prompts Container */
    .schedulux-quick-prompts {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }

    .schedulux-prompt-chip {
      background: #F1F5F9;
      border: 1px solid #E2E8F0;
      color: #334155;
      font-size: 11.5px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.15s ease;
      text-align: left;
      outline: none;
    }

    .schedulux-prompt-chip:hover {
      background: var(--schedulux-primary);
      color: #ffffff;
      border-color: var(--schedulux-primary);
      transform: translateY(-1px);
    }

    /* Typing Indicator */
    .schedulux-typing {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      background: var(--schedulux-agent-bubble-bg);
      border-radius: 12px;
      width: fit-content;
      margin-bottom: 4px;
      align-self: flex-start;
    }

    .schedulux-typing-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #94A3B8;
      animation: schedulux-bounce 1.4s infinite ease-in-out both;
    }

    .schedulux-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .schedulux-typing-dot:nth-child(2) { animation-delay: -0.16s; }

    /* Footer Input Area */
    .schedulux-footer {
      border-top: 1px solid var(--schedulux-border);
      padding: 12px;
      background: var(--schedulux-bg);
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-shrink: 0;
    }

    .schedulux-input-box {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 4px 6px 4px 12px;
      transition: border-color 0.15s ease, box-shadow 0.15s ease;
    }

    .schedulux-input-box:focus-within {
      border-color: var(--schedulux-primary);
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
    }

    .schedulux-textarea {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 13.5px;
      font-family: inherit;
      resize: none;
      max-height: 80px;
      min-height: 22px;
      line-height: 1.4;
      color: #1E293B;
    }

    .schedulux-textarea::placeholder {
      color: #94A3B8;
    }

    .schedulux-send-btn {
      background: var(--schedulux-primary);
      color: #ffffff;
      border: none;
      border-radius: 8px;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;
      outline: none;
      flex-shrink: 0;
    }

    .schedulux-send-btn:hover:not(:disabled) {
      filter: brightness(1.08);
      transform: scale(1.04);
    }

    .schedulux-send-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .schedulux-powered-by {
      font-size: 10px;
      color: #94A3B8;
      text-align: center;
      user-select: none;
    }
    .schedulux-powered-by a {
      color: #64748B;
      text-decoration: none;
      font-weight: 600;
    }
    .schedulux-powered-by a:hover {
      text-decoration: underline;
    }

    /* Keyframes */
    @keyframes schedulux-pulse {
      0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
      70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
      100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    @keyframes schedulux-bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    @keyframes schedulux-slide-up {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Responsive Mobile Screen */
    @media (max-width: 480px) {
      .schedulux-root {
        top: 0 !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
      }
      .schedulux-window {
        width: 100vw !important;
        max-width: 100vw !important;
        height: 100% !important;
        max-height: 100% !important;
        border-radius: 0 !important;
        margin-bottom: 0 !important;
        border: none !important;
      }
      .schedulux-header {
        border-radius: 0 !important;
      }
    }
  `}var Ee=new Map;function cs(e){const t=`${e.tenantId}_${e.agentId}`;if(Ee.has(t)){const d=Ee.get(t);if(d)return d}const s=!!e.container,n=e.container||document.createElement("div");s||(n.id=`schedulux-widget-${e.tenantId}-${e.agentId}`,document.body.appendChild(n));const i=n.attachShadow({mode:"open"}),a=document.createElement("style");let o={...e.config};a.textContent=us(o,e.inline),i.appendChild(a);const u=document.createElement("div");u.className="schedulux-mount-root",i.appendChild(u);const h=new Ii({defaultOptions:{queries:{retry:1,staleTime:3e5,refetchOnWindowFocus:!1}}}),c=d=>{Ps(Qe(si,{client:h},Qe(Tn,{options:e,config:d})),u)};c(o);const p={open:()=>{i.querySelector(".schedulux-window")?.classList.add("is-open")},close:()=>{i.querySelector(".schedulux-window")?.classList.remove("is-open")},toggle:()=>{i.querySelector(".schedulux-window")?.classList.toggle("is-open")},isOpen:()=>!!i.querySelector(".schedulux-window")?.classList.contains("is-open"),sendMessage:async d=>{const l=i.querySelector(".schedulux-textarea"),f=i.querySelector(".schedulux-send-btn");l&&f&&(l.value=d,l.dispatchEvent(new Event("input",{bubbles:!0})),f.click())},resetConversation:()=>{i.querySelector('button[aria-label="Reset conversation"]')?.click()},updateConfig:d=>{o={...o,...d,theme:{...o.theme||{},...d.theme||{}}},a.textContent=us(o,e.inline),c(o)},destroy:()=>{h.clear(),Ps(null,u),s?i.innerHTML="":n.remove(),Ee.delete(t)}};return Ee.set(t,p),Ki(e.apiBase||"",e.tenantId,e.agentId,e.mode||"live").then(d=>{if(d&&Object.keys(d).length>0){const l={...d.theme||{},...e.config?.theme||{}},f={...d,...e.config,theme:l};p.updateConfig(f)}}).catch(d=>{console.warn("[Schedulux Widget] Remote config fetch fallback:",d)}),p}function $n(e,t){const s=`${e}_${t}`,n=Ee.get(s);n&&n.destroy()}if(typeof window<"u"){window.ScheduluxWidget={init:cs,destroy:$n,instances:Ee};const e=document.currentScript||document.querySelector("script[data-tenant-id][data-agent-id]");if(e){const t=e.getAttribute("data-tenant-id"),s=e.getAttribute("data-agent-id"),n=e.getAttribute("data-api-base")||"";if(t&&s){const i=e.getAttribute("data-primary-color"),a=e.getAttribute("data-agent-name"),o=e.getAttribute("data-greeting"),u=e.getAttribute("data-position"),h=e.getAttribute("data-theme-mode");cs({tenantId:t,agentId:s,apiBase:n,config:{agent_name:a||void 0,initial_greeting:o||void 0,position:u||void 0,theme:{primary_color:i||void 0,theme_mode:h||void 0}}})}}}Ae.ChatWidget=Tn,Ae.destroyScheduluxWidget=$n,Ae.getWidgetStyles=us,Ae.initScheduluxWidget=cs})(this.ScheduluxWidgetBundle=this.ScheduluxWidgetBundle||{});
