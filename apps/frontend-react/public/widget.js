(function(j){Object.defineProperty(j,Symbol.toStringTag,{value:"Module"});var Tt,P,fn,pi,_e,gn,_n,mn,gr,At,it,bn,_r,mr,br,xn,It={},Ot=[],fi=/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i,at=Array.isArray;function ae(e,t){for(var r in t)e[r]=t[r];return e}function xr(e){e&&e.parentNode&&e.parentNode.removeChild(e)}function ot(e,t,r){var n,s,i,a={};for(i in t)i=="key"?n=t[i]:i=="ref"?s=t[i]:a[i]=t[i];if(arguments.length>2&&(a.children=arguments.length>3?Tt.call(arguments,2):r),typeof e=="function"&&e.defaultProps!=null)for(i in e.defaultProps)a[i]===void 0&&(a[i]=e.defaultProps[i]);return Et(e,a,n,s,null)}function Et(e,t,r,n,s){var i={type:e,props:t,key:r,ref:n,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:s??++fn,__i:-1,__u:0};return s==null&&P.vnode!=null&&P.vnode(i),i}function We(e){return e.children}function oe(e,t){this.props=e,this.context=t}function Se(e,t){if(t==null)return e.__?Se(e.__,e.__i+1):null;for(var r;t<e.__k.length;t++)if((r=e.__k[t])!=null&&r.__e!=null)return r.__e;return typeof e.type=="function"?Se(e):null}function gi(e){if(e.__P&&e.__d){var t=e.__v,r=t.__e,n=[],s=[],i=ae({},t);i.__v=t.__v+1,P.vnode&&P.vnode(i),yr(e.__P,i,t,e.__n,e.__P.namespaceURI,32&t.__u?[r]:null,n,r??Se(t),!!(32&t.__u),s),i.__v=t.__v,i.__.__k[i.__i]=i,Pn(n,i,s),t.__e=t.__=null,i.__e!=r&&vn(i)}}function vn(e){if((e=e.__)!=null&&e.__c!=null)return e.__e=e.__c.base=null,e.__k.some(function(t){if(t!=null&&t.__e!=null)return e.__e=e.__c.base=t.__e}),vn(e)}function vr(e){(!e.__d&&(e.__d=!0)&&_e.push(e)&&!Ft.__r++||gn!=P.debounceRendering)&&((gn=P.debounceRendering)||_n)(Ft)}function Ft(){try{for(var e,t=1;_e.length;)_e.length>t&&_e.sort(mn),e=_e.shift(),t=_e.length,gi(e)}finally{_e.length=Ft.__r=0}}function yn(e,t,r,n,s,i,a,o,l,u,d){var p,h,f,_,v,m,k=n&&n.__k||Ot,x=t.length;for(l=_i(r,t,k,l,x),p=0;p<x;p++)(f=r.__k[p])!=null&&(h=f.__i!=-1&&k[f.__i]||It,f.__i=p,m=yr(e,f,h,s,i,a,o,l,u,d),_=f.__e,f.ref&&h.ref!=f.ref&&(h.ref&&kr(h.ref,null,f),d.push(f.ref,f.__c||_,f)),v==null&&_!=null&&(v=_),4&f.__u?(l=kn(f,l,e),h.__e&&(h.__e=null)):typeof f.type=="function"&&m!==void 0?l=m:_&&(l=_.nextSibling),f.__u&=-7);return r.__e=v,l}function _i(e,t,r,n,s){var i,a,o,l,u,d=r.length,p=d,h=0;for(e.__k=new Array(s),i=0;i<s;i++)(a=t[i])!=null&&typeof a!="boolean"&&typeof a!="function"?(typeof a=="string"||typeof a=="number"||typeof a=="bigint"||a.constructor==String?a=e.__k[i]=Et(null,a,null,null,null):at(a)?a=e.__k[i]=Et(We,{children:a},null,null,null):a.constructor===void 0&&a.__b>0?a=e.__k[i]=Et(a.type,a.props,a.key,a.ref?a.ref:null,a.__v):e.__k[i]=a,l=i+h,a.__=e,a.__b=e.__b+1,o=null,(u=a.__i=mi(a,r,l,p))!=-1&&(p--,(o=r[u])&&(o.__u|=2)),o==null||o.__v==null?(u==-1&&(s>d?h--:s<d&&h++),typeof a.type!="function"&&(a.__u|=4)):u!=l&&(u==l-1?h--:u==l+1?h++:(u>l?h--:h++,a.__u|=4))):e.__k[i]=null;if(p)for(i=0;i<d;i++)(o=r[i])!=null&&(2&o.__u)==0&&(o.__e==n&&(n=Se(o)),Cn(o,o));return n}function kn(e,t,r){var n,s;if(typeof e.type=="function"){for(n=e.__k,s=0;n&&s<n.length;s++)n[s]&&(n[s].__=e,t=kn(n[s],t,r));return t}e.__e!=t&&(t&&e.type&&!t.parentNode&&(t=Se(e)),t=r.insertBefore(e.__e,t||null));do t=t&&t.nextSibling;while(t!=null&&t.nodeType==8);return t}function Lt(e,t){return t=t||[],e==null||typeof e=="boolean"||(at(e)?e.some(function(r){Lt(r,t)}):t.push(e)),t}function mi(e,t,r,n){var s,i,a,o=e.key,l=e.type,u=t[r],d=u!=null&&(2&u.__u)==0;if(u===null&&o==null||d&&o==u.key&&l==u.type)return r;if(n>(d?1:0)){for(s=r-1,i=r+1;s>=0||i<t.length;)if((u=t[a=s>=0?s--:i++])!=null&&(2&u.__u)==0&&o==u.key&&l==u.type)return a}return-1}function wn(e,t,r){t[0]=="-"?e.setProperty(t,r??""):e[t]=r==null?"":typeof r!="number"||fi.test(t)?r:r+"px"}function zt(e,t,r,n,s){var i,a;e:if(t=="style")if(typeof r=="string")e.style.cssText=r;else{if(typeof n=="string"&&(e.style.cssText=n=""),n)for(t in n)r&&t in r||wn(e.style,t,"");if(r)for(t in r)n&&r[t]==n[t]||wn(e.style,t,r[t])}else if(t[0]=="o"&&t[1]=="n")i=t!=(t=t.replace(bn,"$1")),a=t.toLowerCase(),t=a in e||t=="onFocusOut"||t=="onFocusIn"?a.slice(2):t.slice(2),e.l||(e.l={}),e.l[t+i]=r,r?n?r[it]=n[it]:(r[it]=_r,e.addEventListener(t,i?br:mr,i)):e.removeEventListener(t,i?br:mr,i);else{if(s=="http://www.w3.org/2000/svg")t=t.replace(/xlink(H|:h)/,"h").replace(/sName$/,"s");else if(t!="width"&&t!="height"&&t!="href"&&t!="list"&&t!="form"&&t!="tabIndex"&&t!="download"&&t!="rowSpan"&&t!="colSpan"&&t!="role"&&t!="popover"&&t in e)try{e[t]=r??"";break e}catch{}typeof r=="function"||(r==null||r===!1&&t[4]!="-"?e.removeAttribute(t):e.setAttribute(t,t=="popover"&&r==1?"":r))}}function Sn(e){return function(t){if(this.l){var r=this.l[t.type+e];if(t[At]==null)t[At]=_r++;else if(t[At]<r[it])return;return r(P.event?P.event(t):t)}}}function yr(e,t,r,n,s,i,a,o,l,u){var d,p,h,f,_,v,m,k,x,R,I,M,Q,y,E,L,C=t.type;if(t.constructor!==void 0)return null;128&r.__u&&(l=!!(32&r.__u),i=[o=t.__e=r.__e]),(d=P.__b)&&d(t);e:if(typeof C=="function"){p=a.length;try{if(x=t.props,R=C.prototype&&C.prototype.render,I=(d=C.contextType)&&n[d.__c],M=d?I?I.props.value:d.__:n,r.__c?k=(h=t.__c=r.__c).__=h.__E:(R?t.__c=h=new C(x,M):(t.__c=h=new oe(x,M),h.constructor=C,h.render=xi),I&&I.sub(h),h.state||(h.state={}),h.__n=n,f=h.__d=!0,h.__h=[],h._sb=[]),R&&h.__s==null&&(h.__s=h.state),R&&C.getDerivedStateFromProps!=null&&(h.__s==h.state&&(h.__s=ae({},h.__s)),ae(h.__s,C.getDerivedStateFromProps(x,h.__s))),_=h.props,v=h.state,h.__v=t,f)R&&C.getDerivedStateFromProps==null&&h.componentWillMount!=null&&h.componentWillMount(),R&&h.componentDidMount!=null&&h.__h.push(h.componentDidMount);else{if(R&&C.getDerivedStateFromProps==null&&x!==_&&h.componentWillReceiveProps!=null&&h.componentWillReceiveProps(x,M),t.__v==r.__v||!h.__e&&h.shouldComponentUpdate!=null&&h.shouldComponentUpdate(x,h.__s,M)===!1){t.__v!=r.__v&&(h.props=x,h.state=h.__s,h.__d=!1),t.__e=r.__e,t.__k=r.__k,t.__k.some(function(q){q&&(q.__=t)}),Ot.push.apply(h.__h,h._sb),h._sb=[],h.__h.length&&a.push(h),o=Se(r);break e}h.componentWillUpdate!=null&&h.componentWillUpdate(x,h.__s,M),R&&h.componentDidUpdate!=null&&h.__h.push(function(){h.componentDidUpdate(_,v,m)})}if(h.context=M,h.props=x,h.__P=e,h.__e=!1,Q=P.__r,y=0,R)h.state=h.__s,h.__d=!1,Q&&Q(t),d=h.render(h.props,h.state,h.context),Ot.push.apply(h.__h,h._sb),h._sb=[];else do h.__d=!1,Q&&Q(t),d=h.render(h.props,h.state,h.context),h.state=h.__s;while(h.__d&&++y<25);h.state=h.__s,h.getChildContext!=null&&(n=ae(ae({},n),h.getChildContext())),R&&!f&&h.getSnapshotBeforeUpdate!=null&&(m=h.getSnapshotBeforeUpdate(_,v)),E=d!=null&&d.type===We&&d.key==null?Rn(d.props.children):d,o=yn(e,at(E)?E:[E],t,r,n,s,i,a,o,l,u),h.base=t.__e,t.__u&=-161,h.__h.length&&a.push(h),k&&(h.__E=h.__=null)}catch(q){if(a.length=p,t.__v=null,l||i!=null){if(q.then){for(t.__u|=l?160:128;o&&o.nodeType==8&&o.nextSibling;)o=o.nextSibling;i!=null&&(i[i.indexOf(o)]=null),t.__e=o}else if(i!=null)for(L=i.length;L--;)xr(i[L])}else t.__e=r.__e;t.__k??(t.__k=r.__k||[]),q.then||$n(t),P.__e(q,t,r)}}else i==null&&t.__v==r.__v?(t.__k=r.__k,t.__e=r.__e):o=t.__e=bi(r.__e,t,r,n,s,i,a,l,u);return(d=P.diffed)&&d(t),128&t.__u?void 0:o}function $n(e){e&&(e.__c&&(e.__c.__e=!0),e.__k&&e.__k.some($n))}function Pn(e,t,r){for(var n=0;n<r.length;n++)kr(r[n],r[++n],r[++n]);P.__c&&P.__c(t,e),e.some(function(s){try{e=s.__h,s.__h=[],e.some(function(i){i.call(s)})}catch(i){P.__e(i,s.__v)}})}function Rn(e){return typeof e!="object"||e==null||e.__b>0?e:at(e)?e.map(Rn):e.constructor!==void 0?null:ae({},e)}function bi(e,t,r,n,s,i,a,o,l){var u,d,p,h,f,_,v,m=r.props||It,k=t.props,x=t.type;if(x=="svg"?s="http://www.w3.org/2000/svg":x=="math"?s="http://www.w3.org/1998/Math/MathML":s||(s="http://www.w3.org/1999/xhtml"),i!=null){for(u=0;u<i.length;u++)if((f=i[u])&&"setAttribute"in f==!!x&&(x?f.localName==x:f.nodeType==3)){e=f,i[u]=null;break}}if(e==null){if(x==null)return document.createTextNode(k);e=document.createElementNS(s,x,k.is&&k),o&&(P.__m&&P.__m(t,i),o=!1),i=null}if(x==null)m===k||o&&e.data==k||(e.data=k);else{if(i=x=="textarea"&&k.defaultValue!=null?null:i&&Tt.call(e.childNodes),!o&&i!=null)for(m={},u=0;u<e.attributes.length;u++)m[(f=e.attributes[u]).name]=f.value;for(u in m)f=m[u],u=="dangerouslySetInnerHTML"?p=f:u=="children"||u in k||u=="value"&&"defaultValue"in k||u=="checked"&&"defaultChecked"in k||zt(e,u,null,f,s);for(u in k)f=k[u],u=="children"?h=f:u=="dangerouslySetInnerHTML"?d=f:u=="value"?_=f:u=="checked"?v=f:o&&typeof f!="function"||m[u]===f||zt(e,u,f,m[u],s);if(d)o||p&&(d.__html==p.__html||d.__html==e.innerHTML)||(e.innerHTML=d.__html),t.__k=[];else if(p&&(e.innerHTML=""),yn(t.type=="template"?e.content:e,at(h)?h:[h],t,r,n,x=="foreignObject"?"http://www.w3.org/1999/xhtml":s,i,a,i?i[0]:r.__k&&Se(r,0),o,l),i!=null)for(u=i.length;u--;)xr(i[u]);o&&x!="textarea"||(u="value",x=="progress"&&_==null?e.removeAttribute("value"):_!=null&&(_!==e[u]||x=="progress"&&!_||x=="option"&&_!=m[u])&&zt(e,u,_,m[u],s),u="checked",v!=null&&v!=e[u]&&zt(e,u,v,m[u],s))}return e}function kr(e,t,r){try{if(typeof e=="function"){var n=typeof e.__u=="function";n&&e.__u(),n&&t==null||(e.__u=e(t))}else e.current=t}catch(s){P.__e(s,r)}}function Cn(e,t,r){var n,s;if(P.unmount&&P.unmount(e),(n=e.ref)&&(n.current&&n.current!=e.__e||kr(n,null,t)),(n=e.__c)!=null){if(n.componentWillUnmount)try{n.componentWillUnmount()}catch(i){P.__e(i,t)}n.base=n.__P=n.__n=null}if(n=e.__k)for(s=0;s<n.length;s++)n[s]&&Cn(n[s],t,r||typeof e.type!="function");r||xr(e.__e),e.__c=e.__=e.__e=void 0}function xi(e,t,r){return this.constructor(e,r)}function Mn(e,t,r){var n,s,i,a;t==document&&(t=document.documentElement),P.__&&P.__(e,t),s=(n=typeof r=="function")?null:r&&r.__k||t.__k,i=[],a=[],yr(t,e=(!n&&r||t).__k=ot(We,null,[e]),s||It,It,t.namespaceURI,!n&&r?[r]:s?null:t.firstChild?Tt.call(t.childNodes):null,i,!n&&r?r:s?s.__e:t.firstChild,n,a),Pn(i,e,a),e.props.children=null}function wr(e){function t(r){var n,s;return this.getChildContext||(n=new Set,(s={})[t.__c]=this,this.getChildContext=function(){return s},this.componentWillUnmount=function(){n=null},this.shouldComponentUpdate=function(i){this.props.value!=i.value&&n.forEach(function(a){a.__e=!0,vr(a)})},this.sub=function(i){n.add(i);var a=i.componentWillUnmount;i.componentWillUnmount=function(){n&&n.delete(i),a&&a.call(i)}}),r.children}return t.__c="__cC"+xn++,t.__=e,t.Provider=t.__l=(t.Consumer=function(r,n){return r.children(n)}).contextType=t,t}Tt=Ot.slice,P={__e:function(e,t,r,n){for(var s,i,a;t=t.__;)if((s=t.__c)&&!s.__)try{if((i=s.constructor)&&i.getDerivedStateFromError!=null&&(s.setState(i.getDerivedStateFromError(e)),a=s.__d),s.componentDidCatch!=null&&(s.componentDidCatch(e,n||{}),a=s.__d),a)return s.__E=s}catch(o){e=o}throw e}},fn=0,pi=function(e){return e!=null&&e.constructor===void 0},oe.prototype.setState=function(e,t){var r=this.__s!=null&&this.__s!=this.state?this.__s:this.__s=ae({},this.state);typeof e=="function"&&(e=e(ae({},r),this.props)),e&&ae(r,e),e!=null&&this.__v&&(t&&this._sb.push(t),vr(this))},oe.prototype.forceUpdate=function(e){this.__v&&(this.__e=!0,e&&this.__h.push(e),vr(this))},oe.prototype.render=We,_e=[],_n=typeof Promise=="function"?Promise.prototype.then.bind(Promise.resolve()):setTimeout,mn=function(e,t){return e.__v.__b-t.__v.__b},Ft.__r=0,gr=Math.random().toString(8),At="__d"+gr,it="__a"+gr,bn=/(PointerCapture)$|Capture$/i,_r=0,mr=Sn(!1),br=Sn(!0),xn=0;var $e,z,Sr,Tn,lt=0,An=[],D=P,In=D.__b,On=D.__r,En=D.diffed,Fn=D.__c,Ln=D.unmount,zn=D.__;function ct(e,t){D.__h&&D.__h(z,e,lt||t),lt=0;var r=z.__H||(z.__H={__:[],__h:[]});return e>=r.__.length&&r.__.push({}),r.__[e]}function le(e){return lt=1,vi(Dn,e)}function vi(e,t,r){var n=ct($e++,2);if(n.t=e,!n.__c&&(n.__=[r?r(t):Dn(void 0,t),function(o){var l=n.__N?n.__N[0]:n.__[0],u=n.t(l,o);l!==u&&(n.__N=[u,n.__[1]],n.__c.setState({}))}],n.__c=z,!z.__f)){var s=function(o,l,u){if(!n.__c.__H)return!0;var d=!1,p=n.__c.props!==o;if(n.__c.__H.__.some(function(f){if(f.__N){d=!0;var _=f.__[0];f.__=f.__N,f.__N=void 0,_!==f.__[0]&&(p=!0)}}),i){var h=i.call(this,o,l,u);return d?h||p:h}return!d||p};z.__f=!0;var i=z.shouldComponentUpdate,a=z.componentWillUpdate;z.componentWillUpdate=function(o,l,u){if(this.__e){var d=i;i=void 0,s(o,l,u),i=d}a&&a.call(this,o,l,u)},z.shouldComponentUpdate=s}return n.__N||n.__}function ce(e,t){var r=ct($e++,3);!D.__s&&Rr(r.__H,t)&&(r.__=e,r.u=t,z.__H.__h.push(r))}function yi(e,t){var r=ct($e++,4);!D.__s&&Rr(r.__H,t)&&(r.__=e,r.u=t,z.__h.push(r))}function Qe(e){return lt=5,ut(function(){return{current:e}},[])}function ut(e,t){var r=ct($e++,7);return Rr(r.__H,t)&&(r.__=e(),r.__H=t,r.__h=e),r.__}function Pe(e,t){return lt=8,ut(function(){return e},t)}function $r(e){var t=z.context[e.__c],r=ct($e++,9);return r.c=e,t?(r.__??(r.__=!0,t.sub(z)),t.props.value):e.__}function ki(){for(var e;e=An.shift();){var t=e.__H;if(e.__P&&t)try{t.__h.some(Bt),t.__h.some(Pr),t.__h=[]}catch(r){t.__h=[],D.__e(r,e.__v)}}}D.__b=function(e){z=null,In&&In(e)},D.__=function(e,t){e&&t.__k&&t.__k.__m&&(e.__m=t.__k.__m),zn&&zn(e,t)},D.__r=function(e){On&&On(e),$e=0;var t=(z=e.__c).__H;t&&(Sr===z?(t.__h=[],z.__h=[],t.__.some(function(r){r.__N&&(r.__=r.__N),r.u=r.__N=void 0})):(t.__h.some(Bt),t.__h.some(Pr),t.__h=[],$e=0)),Sr=z},D.diffed=function(e){En&&En(e);var t=e.__c;t&&t.__H&&(t.__H.__h.length&&(An.push(t)!==1&&Tn===D.requestAnimationFrame||((Tn=D.requestAnimationFrame)||wi)(ki)),t.__H.__.some(function(r){r.u&&(r.__H=r.u,r.u=void 0)})),Sr=z=null},D.__c=function(e,t){t.some(function(r){try{r.__h.some(Bt),r.__h=r.__h.filter(function(n){return!n.__||Pr(n)})}catch(n){t.some(function(s){s.__h&&(s.__h=[])}),t=[],D.__e(n,r.__v)}}),Fn&&Fn(e,t)},D.unmount=function(e){Ln&&Ln(e);var t,r=e.__c;r&&r.__H&&(r.__H.__.some(function(n){try{Bt(n)}catch(s){t=s}}),r.__H=void 0,t&&D.__e(t,r.__v))};var Bn=typeof requestAnimationFrame=="function";function wi(e){var t,r=function(){clearTimeout(n),Bn&&cancelAnimationFrame(t),setTimeout(e)},n=setTimeout(r,35);Bn&&(t=requestAnimationFrame(r))}function Bt(e){var t=z,r=e.__c;typeof r=="function"&&(e.__c=void 0,r()),z=t}function Pr(e){var t=z;e.__c=e.__(),z=t}function Rr(e,t){return!e||e.length!==t.length||t.some(function(r,n){return r!==e[n]})}function Dn(e,t){return typeof t=="function"?t(e):t}function Si(e,t){for(var r in t)e[r]=t[r];return e}function Nn(e,t){for(var r in e)if(r!=="__source"&&!(r in t))return!0;for(var n in t)if(n!=="__source"&&e[n]!==t[n])return!0;return!1}function Wn(e,t){var r=t(),n=le({t:{__:r,u:t}}),s=n[0].t,i=n[1];return yi(function(){s.__=r,s.u=t,Cr(s)&&i({t:s})},[e,r,t]),ce(function(){return Cr(s)&&i({t:s}),e(function(){Cr(s)&&i({t:s})})},[e]),r}function Cr(e){try{return!((t=e.__)===(r=e.u())&&(t!==0||1/t==1/r)||t!=t&&r!=r)}catch{return!0}var t,r}function Qn(e,t){this.props=e,this.context=t}(Qn.prototype=new oe).isPureReactComponent=!0,Qn.prototype.shouldComponentUpdate=function(e,t){return Nn(this.props,e)||Nn(this.state,t)};var qn=P.__b;P.__b=function(e){e.type&&e.type.__f&&e.ref&&(e.props.ref=e.ref,e.ref=null),qn&&qn(e)};var el=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.forward_ref")||3911,$i=P.__e;P.__e=function(e,t,r,n){if(e.then){for(var s,i=t;i=i.__;)if((s=i.__c)&&s.__c)return t.__e??(t.__e=r.__e,t.__k=r.__k||[]),s.__c(e,t)}$i(e,t,r,n)};var jn=P.unmount;function Un(e,t,r){return e&&(e.__c&&e.__c.__H&&(e.__c.__H.__.forEach(function(n){typeof n.__c=="function"&&n.__c()}),e.__c.__H=null),(e=Si({},e)).__c!=null&&(e.__c.__P===r&&(e.__c.__P=t),e.__c.__e=!0,e.__c=null),e.__k=e.__k&&e.__k.map(function(n){return Un(n,t,r)})),e}function Hn(e,t,r){return e&&r&&(e.__v=null,e.__k=e.__k&&e.__k.map(function(n){return Hn(n,t,r)}),e.__c&&e.__c.__P===t&&(e.__e&&r.appendChild(e.__e),e.__c.__e=!0,e.__c.__P=r)),e}function Mr(){this.__u=0,this.o=null,this.__b=null}function Kn(e){var t=e.__&&e.__.__c;return t&&t.__a&&t.__a(e)}function Dt(){this.i=null,this.l=null}P.unmount=function(e){var t=e.__c;t&&(t.__z=!0),t&&t.__R&&t.__R(),t&&32&e.__u&&(e.type=null),jn&&jn(e)},(Mr.prototype=new oe).__c=function(e,t){var r=t.__c,n=this;n.o??(n.o=[]),n.o.push(r);var s=Kn(n.__v),i=!1,a=function(){i||n.__z||(i=!0,r.__R=null,s?s(l):l())};r.__R=a;var o=r.__P;r.__P=null;var l=function(){if(!--n.__u){if(n.state.__a){var u=n.state.__a;n.__v.__k[0]=Hn(u,u.__c.__P,u.__c.__O)}var d;for(n.setState({__a:n.__b=null});d=n.o.pop();)d.__P=o,d.forceUpdate()}};n.__u++||32&t.__u||n.setState({__a:n.__b=n.__v.__k[0]}),e.then(a,a)},Mr.prototype.componentWillUnmount=function(){this.o=[]},Mr.prototype.render=function(e,t){if(this.__b){if(this.__v.__k){var r=document.createElement("div"),n=this.__v.__k[0].__c;this.__v.__k[0]=Un(this.__b,r,n.__O=n.__P)}this.__b=null}var s=t.__a&&ot(We,null,e.fallback);return s&&(s.__u&=-33),[ot(We,null,t.__a?null:e.children),s]};var Zn=function(e,t,r){if(++r[1]===r[0]&&e.l.delete(t),e.props.revealOrder&&(e.props.revealOrder[0]!=="t"||!e.l.size))for(r=e.i;r;){for(;r.length>3;)r.pop()();if(r[1]<r[0])break;e.i=r=r[2]}};(Dt.prototype=new oe).__a=function(e){var t=this,r=Kn(t.__v),n=t.l.get(e);return n[0]++,function(s){var i=function(){t.props.revealOrder?(n.push(s),Zn(t,e,n)):s()};r?r(i):i()}},Dt.prototype.render=function(e){this.i=null,this.l=new Map;var t=Lt(e.children);e.revealOrder&&e.revealOrder[0]==="b"&&t.reverse();for(var r=t.length;r--;)this.l.set(t[r],this.i=[1,0,this.i]);return e.children},Dt.prototype.componentDidUpdate=Dt.prototype.componentDidMount=function(){var e=this;this.l.forEach(function(t,r){Zn(e,r,t)})};var Pi=typeof Symbol<"u"&&Symbol.for&&Symbol.for("react.element")||60103,Ri=/^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|image(!S)|letter|lighting|marker(?!H|W|U)|overline|paint|pointer|shape|stop|strikethrough|stroke|text(?!L)|transform|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/,Ci=/^on(Ani|Tra|Tou|BeforeInp|Compo)/,Mi=/[A-Z0-9]/g,Ti=typeof document<"u",Ai=function(e){return(typeof Symbol<"u"&&typeof Symbol()=="symbol"?/fil|che|rad/:/fil|che|ra/).test(e)};oe.prototype.isReactComponent=!0,["componentWillMount","componentWillReceiveProps","componentWillUpdate"].forEach(function(e){Object.defineProperty(oe.prototype,e,{configurable:!0,get:function(){return this["UNSAFE_"+e]},set:function(t){Object.defineProperty(this,e,{configurable:!0,writable:!0,value:t})}})});var Gn=P.event;P.event=function(e){return Gn&&(e=Gn(e)),e.persist=function(){},e.isPropagationStopped=function(){return this.cancelBubble},e.isDefaultPrevented=function(){return this.defaultPrevented},e.nativeEvent=e};var Vn,Ii={configurable:!0,get:function(){return this.class}},Xn=P.vnode;P.vnode=function(e){typeof e.type=="string"&&(function(t){var r=t.props,n=t.type,s={},i=n.indexOf("-")==-1;for(var a in r){var o=r[a];if(!(a==="value"&&"defaultValue"in r&&o==null||Ti&&a==="children"&&n==="noscript"||a==="class"||a==="className")){var l=a.toLowerCase();a==="defaultValue"&&"value"in r&&r.value==null?a="value":a==="download"&&o===!0?o="":l==="translate"&&o==="no"?o=!1:l[0]==="o"&&l[1]==="n"?l==="ondoubleclick"?a="ondblclick":l!=="onchange"||n!=="input"&&n!=="textarea"||Ai(r.type)?l==="onfocus"?a="onfocusin":l==="onblur"?a="onfocusout":Ci.test(a)&&(a=l):l=a="oninput":i&&Ri.test(a)?a=a.replace(Mi,"-$&").toLowerCase():o===null&&(o=void 0),l==="oninput"&&s[a=l]&&(a="oninputCapture"),s[a]=o}}n=="select"&&(s.multiple&&Array.isArray(s.value)&&(s.value=Lt(r.children).forEach(function(u){u.props.selected=s.value.indexOf(u.props.value)!=-1})),s.defaultValue!=null&&(s.value=Lt(r.children).forEach(function(u){u.props.selected=s.multiple?s.defaultValue.indexOf(u.props.value)!=-1:s.defaultValue==u.props.value}))),r.class&&!r.className?(s.class=r.class,Object.defineProperty(s,"className",Ii)):r.className&&(s.class=s.className=r.className),t.props=s})(e),e.$$typeof=Pi,Xn&&Xn(e)};var Yn=P.__r;P.__r=function(e){Yn&&Yn(e),Vn=e.__c};var Jn=P.diffed;P.diffed=function(e){Jn&&Jn(e);var t=e.props,r=e.__e;r!=null&&e.type==="textarea"&&"value"in t&&t.value!==r.value&&(r.value=t.value==null?"":t.value),Vn=null};var Oi=0,tl=Array.isArray;function g(e,t,r,n,s,i){t||(t={});var a,o,l=t;if("ref"in l)for(o in l={},t)o=="ref"?a=t[o]:l[o]=t[o];var u={type:e,props:l,key:r,ref:a,__k:null,__:null,__b:0,__e:null,__c:null,constructor:void 0,__v:--Oi,__i:-1,__u:0,__source:s,__self:i};if(typeof e=="function"&&(a=e.defaultProps))for(o in a)l[o]===void 0&&(l[o]=a[o]);return P.vnode&&P.vnode(u),u}var es=wr(void 0),Tr=e=>{const t=$r(es);if(e)return e;if(!t)throw new Error("No QueryClient set, use QueryClientProvider to set one");return t},Ei=({client:e,children:t})=>(ce(()=>(e.mount(),()=>{e.unmount()}),[e]),g(es.Provider,{value:e,children:t}));function ts(e,t){if(t.has(e))throw new TypeError("Cannot initialize the same private elements twice on an object")}function w(e,t,r){ts(e,t),t.set(e,r)}function S(e,t,r){if(typeof e=="function"?e===t:e.has(t))return arguments.length<3?t:r;throw new TypeError("Private element is not present on this object")}function c(e,t){return e.get(S(e,t))}function b(e,t,r){return e.set(S(e,t),r),r}var Re,rs,Fi={setTimeout:(e,t)=>setTimeout(e,t),clearTimeout:e=>clearTimeout(e),setInterval:(e,t)=>setInterval(e,t),clearInterval:e=>clearInterval(e)},Li=(Re=new WeakMap,rs=new WeakMap,class{constructor(){w(this,Re,Fi),w(this,rs,!1)}setTimeoutProvider(e){b(Re,this,e)}setTimeout(e,t){return c(Re,this).setTimeout(e,t)}clearTimeout(e){c(Re,this).clearTimeout(e)}setInterval(e,t){return c(Re,this).setInterval(e,t)}clearInterval(e){c(Re,this).clearInterval(e)}}),Ce=new Li;function zi(e){setTimeout(e,0)}var Bi=typeof window>"u"||"Deno"in globalThis;function Z(){}function Di(e,t){return typeof e=="function"?e(t):e}function ns(e){return typeof e=="number"&&e>=0&&e!==1/0}function ss(e,t){return Math.max(e+(t||0)-Date.now(),0)}function B(e,t){return typeof e=="function"?e(t):e}function is(e,t){const{type:r="all",exact:n,fetchStatus:s,predicate:i,queryKey:a,stale:o}=e;if(a){if(n){if(t.queryHash!==Ar(a,t.options))return!1}else if(!qe(t.queryKey,a))return!1}if(r!=="all"){const l=t.isActive();if(r==="active"&&!l||r==="inactive"&&l)return!1}return!(typeof o=="boolean"&&t.isStale()!==o||s&&s!==t.state.fetchStatus||i&&!i(t))}function as(e,t){const{exact:r,status:n,predicate:s,mutationKey:i}=e;if(i){if(!t.options.mutationKey)return!1;if(r){if(Me(t.options.mutationKey)!==Me(i))return!1}else if(!qe(t.options.mutationKey,i))return!1}return!(n&&t.state.status!==n||s&&!s(t))}function Ar(e,t){return(t?.queryKeyHashFn||Me)(e)}function Me(e){return JSON.stringify(e,(t,r)=>Ir(r)?Object.keys(r).sort().reduce((n,s)=>(n[s]=r[s],n),{}):r)}function qe(e,t){if(e===t)return!0;if(typeof e!=typeof t)return!1;if(e&&t&&typeof e=="object"&&typeof t=="object"){if(Array.isArray(e)&&Array.isArray(t)){if(t.length>e.length)return!1;for(let n=0;n<t.length;n++)if(!qe(e[n],t[n]))return!1;return!0}const r=Object.keys(t);for(const n of r)if(!qe(e[n],t[n]))return!1;return!0}return!1}var Ni=Object.prototype.hasOwnProperty;function os(e,t,r=0){if(e===t)return e;if(r>500)return t;const n=ls(e)&&ls(t);if(!n&&!(Ir(e)&&Ir(t)))return t;const s=(n?e:Object.keys(e)).length,i=n?t:Object.keys(t),a=i.length,o=n?new Array(a):{};let l=0;for(let u=0;u<a;u++){const d=n?u:i[u],p=e[d],h=t[d];if(p===h){o[d]=p,(n?u<s:Ni.call(e,d))&&l++;continue}if(p===null||h===null||typeof p!="object"||typeof h!="object"){o[d]=h;continue}const f=os(p,h,r+1);o[d]=f,f===p&&l++}return s===a&&l===s?e:o}function Nt(e,t){if(!t||Object.keys(e).length!==Object.keys(t).length)return!1;for(const r in e)if(e[r]!==t[r])return!1;return!0}function ls(e){return Array.isArray(e)&&e.length===Object.keys(e).length}function Ir(e){if(!cs(e))return!1;const t=Object.getPrototypeOf(e),r=t?.constructor;if(r===void 0)return!0;if(typeof r!="function")return!1;const n=r.prototype;return!(!cs(n)||!n.hasOwnProperty("isPrototypeOf")||t!==Object.prototype)}function cs(e){return Object.prototype.toString.call(e)==="[object Object]"}function Wi(e){return new Promise(t=>{Ce.setTimeout(t,e)})}function Or(e,t,r){return typeof r.structuralSharing=="function"?r.structuralSharing(e,t):r.structuralSharing!==!1?os(e,t):t}function Qi(e,t,r=0){const n=[...e,t];return r&&n.length>r?n.slice(1):n}function qi(e,t,r=0){const n=[t,...e];return r&&n.length>r?n.slice(0,-1):n}var Er=Symbol();function us(e,t){return!e.queryFn&&t?.initialPromise?()=>t.initialPromise:!e.queryFn||e.queryFn===Er?()=>Promise.reject(new Error(`Missing queryFn: '${e.queryHash}'`)):e.queryFn}function Fr(e,t){return typeof e=="function"?e(...t):!!e}function ji(e,t,r){let n=!1,s;return Object.defineProperty(e,"signal",{enumerable:!0,get:()=>(s??(s=t()),n||(n=!0,s.aborted?r():s.addEventListener("abort",r,{once:!0})),s)}),e}var Ui=()=>Bi,Lr=()=>Ui(),je=class{constructor(){this.listeners=new Set,this.subscribe=this.subscribe.bind(this)}subscribe(e){return this.listeners.add(e),this.onSubscribe(),()=>{this.listeners.delete(e),this.onUnsubscribe()}}hasListeners(){return this.listeners.size>0}onSubscribe(){}onUnsubscribe(){}},ht=new WeakMap,Ue=new WeakMap,Wt=new WeakMap,Hi=class extends je{constructor(){super(),w(this,ht,void 0),w(this,Ue,void 0),w(this,Wt,void 0),b(Wt,this,e=>{if(typeof window<"u"&&window.addEventListener){const t=()=>e();return window.addEventListener("visibilitychange",t,!1),()=>{window.removeEventListener("visibilitychange",t)}}})}onSubscribe(){c(Ue,this)||this.setEventListener(c(Wt,this))}onUnsubscribe(){this.hasListeners()||(c(Ue,this)?.call(this),b(Ue,this,void 0))}setEventListener(e){b(Wt,this,e),c(Ue,this)?.call(this),b(Ue,this,e(t=>{typeof t=="boolean"?this.setFocused(t):this.onFocus()}))}setFocused(e){c(ht,this)!==e&&(b(ht,this,e),this.onFocus())}onFocus(){const e=this.isFocused();this.listeners.forEach(t=>{t(e)})}isFocused(){return typeof c(ht,this)=="boolean"?c(ht,this):globalThis.document?.visibilityState!=="hidden"}},zr=new Hi,Ki=zi;function Zi(){let e=[],t=0,r=o=>{o()},n=o=>{o()},s=Ki;const i=o=>{t?e.push(o):s(()=>{r(o)})},a=()=>{const o=e;e=[],o.length&&s(()=>{n(()=>{o.forEach(l=>{r(l)})})})};return{batch:o=>{let l;t++;try{l=o()}finally{t--,t||a()}return l},batchCalls:o=>(...l)=>{i(()=>{o(...l)})},schedule:i,setNotifyFunction:o=>{r=o},setBatchNotifyFunction:o=>{n=o},setScheduler:o=>{s=o}}}var U=Zi(),Qt=new WeakMap,He=new WeakMap,qt=new WeakMap,Gi=class extends je{constructor(){super(),w(this,Qt,!0),w(this,He,void 0),w(this,qt,void 0),b(qt,this,e=>{if(typeof window<"u"&&window.addEventListener){const t=()=>e(!0),r=()=>e(!1);return window.addEventListener("online",t,!1),window.addEventListener("offline",r,!1),()=>{window.removeEventListener("online",t),window.removeEventListener("offline",r)}}})}onSubscribe(){c(He,this)||this.setEventListener(c(qt,this))}onUnsubscribe(){this.hasListeners()||(c(He,this)?.call(this),b(He,this,void 0))}setEventListener(e){b(qt,this,e),c(He,this)?.call(this),b(He,this,e(this.setOnline.bind(this)))}setOnline(e){c(Qt,this)!==e&&(b(Qt,this,e),this.listeners.forEach(t=>{t(e)}))}isOnline(){return c(Qt,this)}},jt=new Gi;function Vi(e){return Math.min(1e3*2**e,3e4)}function hs(e){return(e??"online")==="online"?jt.isOnline():!0}var Br=class extends Error{constructor(e){super("CancelledError"),this.revert=e?.revert,this.silent=e?.silent}};function ds(e){let t=!1,r=0,n,s="pending",i,a;const o=new Promise((x,R)=>{i=x,a=R});o.catch(Z);const l=()=>s!=="pending",u=x=>{if(!l()){const R=new Br(x);v(R),e.onCancel?.(R)}},d=()=>{t=!0},p=()=>{t=!1},h=()=>zr.isFocused()&&(e.networkMode==="always"||jt.isOnline())&&e.canRun(),f=()=>hs(e.networkMode)&&e.canRun(),_=x=>{l()||(n?.(),s="resolved",i(x))},v=x=>{l()||(n?.(),s="rejected",a(x))},m=()=>new Promise(x=>{n=R=>{(l()||h())&&x(R)},e.onPause?.()}).then(()=>{n=void 0,l()||e.onContinue?.()}),k=()=>{if(l())return;let x;const R=r===0?e.initialPromise:void 0;try{x=R??e.fn()}catch(I){x=Promise.reject(I)}Promise.resolve(x).then(_).catch(I=>{if(l())return;const M=e.retry??(Lr()?0:3),Q=e.retryDelay??Vi,y=typeof Q=="function"?Q(r,I):Q,E=M===!0||typeof M=="number"&&r<M||typeof M=="function"&&M(r,I);if(t||!E){v(I);return}r++,e.onFail?.(r,I),Wi(y).then(()=>h()?void 0:m()).then(()=>{t?v(I):k()})})};return{promise:o,status:()=>s,cancel:u,continue:()=>(n?.(),o),cancelRetry:d,continueRetry:p,canStart:f,start:()=>(f()?k():m().then(k),o)}}var dt=new WeakMap,ps=class{constructor(){w(this,dt,void 0)}destroy(){this.clearGcTimeout()}scheduleGc(){this.clearGcTimeout(),ns(this.gcTime)&&b(dt,this,Ce.setTimeout(()=>{this.optionalRemove()},this.gcTime))}updateGcTime(e){this.gcTime=Math.max(this.gcTime||0,e??(Lr()?1/0:3e5))}clearGcTimeout(){c(dt,this)!==void 0&&(Ce.clearTimeout(c(dt,this)),b(dt,this,void 0))}};function Xi(e){return{onFetch:(t,r)=>{const n=t.options,s=t.fetchOptions?.meta?.fetchMore?.direction,i=t.state.data?.pages||[],a=t.state.data?.pageParams||[];let o={pages:[],pageParams:[]},l=0;const u=async()=>{let d=!1;const p=_=>{ji(_,()=>t.signal,()=>d=!0)},h=us(t.options,t.fetchOptions),f=async(_,v,m)=>{if(d)return Promise.reject(t.signal.reason);if(v==null&&_.pages.length)return Promise.resolve(_);const x=(()=>{const Q={client:t.client,queryKey:t.queryKey,pageParam:v,direction:m?"backward":"forward",meta:t.options.meta};return p(Q),Q})(),R=await h(x),{maxPages:I}=t.options,M=m?qi:Qi;return{pages:M(_.pages,R,I),pageParams:M(_.pageParams,v,I)}};if(s&&i.length){const _=s==="backward",v=_?fs:Dr,m={pages:i,pageParams:a};o=await f(m,v(n,m),_)}else{const _=e??i.length;do{const v=l===0?a[0]??n.initialPageParam:Dr(n,o);if(l>0&&v==null)break;o=await f(o,v),l++}while(l<_)}return o};t.options.persister?t.fetchFn=()=>t.options.persister?.(u,{client:t.client,queryKey:t.queryKey,meta:t.options.meta,signal:t.signal},r):t.fetchFn=u}}}function Dr(e,{pages:t,pageParams:r}){const n=t.length-1;return t.length>0?e.getNextPageParam(t[n],t,r[n],r):void 0}function fs(e,{pages:t,pageParams:r}){return t.length>0?e.getPreviousPageParam?.(t[0],t,r[0],r):void 0}function Yi(e,t){return t?Dr(e,t)!=null:!1}function Ji(e,t){return!t||!e.getPreviousPageParam?!1:fs(e,t)!=null}function pt(e,t){ts(e,t),t.add(e)}var Ut=new WeakMap,ft=new WeakMap,Ht=new WeakMap,se=new WeakMap,gt=new WeakMap,K=new WeakMap,Nr=new WeakMap,_t=new WeakMap,ue=new WeakSet,ea=class extends ps{constructor(e){super(),pt(this,ue),w(this,Ut,void 0),w(this,ft,void 0),w(this,Ht,void 0),w(this,se,void 0),w(this,gt,void 0),w(this,K,void 0),w(this,Nr,void 0),w(this,_t,void 0),b(_t,this,!1),b(Nr,this,e.defaultOptions),this.setOptions(e.options),this.observers=[],b(gt,this,e.client),b(se,this,c(gt,this).getQueryCache()),this.queryKey=e.queryKey,this.queryHash=e.queryHash,b(ft,this,ms(this.options)),this.state=e.state??c(ft,this),this.scheduleGc()}get meta(){return this.options.meta}get queryType(){return c(Ut,this)}get promise(){return c(K,this)?.promise}setOptions(e){if(this.options={...c(Nr,this),...e},e?._type&&b(Ut,this,e._type),this.updateGcTime(this.options.gcTime),this.state&&this.state.data===void 0){const t=ms(this.options);t.data!==void 0&&(this.setState(_s(t.data,t.dataUpdatedAt)),b(ft,this,t))}}optionalRemove(){!this.observers.length&&this.state.fetchStatus==="idle"&&c(se,this).remove(this)}setData(e,t){const r=Or(this.state.data,e,this.options);return S(ue,this,me).call(this,{data:r,type:"success",dataUpdatedAt:t?.updatedAt,manual:t?.manual}),r}setState(e){S(ue,this,me).call(this,{type:"setState",state:e})}cancel(e){const t=c(K,this)?.promise;return c(K,this)?.cancel(e),t?t.then(Z).catch(Z):Promise.resolve()}destroy(){super.destroy(),this.cancel({silent:!0})}get resetState(){return c(ft,this)}reset(){this.destroy(),this.setState(this.resetState)}isActive(){return this.observers.some(e=>B(e.options.enabled,this)!==!1)}isDisabled(){return this.getObserversCount()>0?!this.isActive():this.options.queryFn===Er||!this.isFetched()}isFetched(){return this.state.dataUpdateCount+this.state.errorUpdateCount>0}isStatic(){return this.getObserversCount()>0?this.observers.some(e=>B(e.options.staleTime,this)==="static"):!1}isStale(){return this.getObserversCount()>0?this.observers.some(e=>e.getCurrentResult().isStale):this.state.data===void 0||this.state.isInvalidated}isStaleByTime(e=0){return this.state.data===void 0?!0:e==="static"?!1:this.state.isInvalidated?!0:!ss(this.state.dataUpdatedAt,e)}onFocus(){this.observers.find(e=>e.shouldFetchOnWindowFocus())?.refetch({cancelRefetch:!1}),c(K,this)?.continue()}onOnline(){this.observers.find(e=>e.shouldFetchOnReconnect())?.refetch({cancelRefetch:!1}),c(K,this)?.continue()}addObserver(e){this.observers.includes(e)||(this.observers.push(e),this.clearGcTimeout(),c(se,this).notify({type:"observerAdded",query:this,observer:e}))}removeObserver(e){const t=this.observers.indexOf(e);t!==-1&&(this.observers.splice(t,1),this.observers.length||(c(K,this)&&(c(_t,this)||this.state.fetchStatus==="paused"&&this.state.status==="pending"?c(K,this).cancel({revert:!0}):c(K,this).cancelRetry()),this.scheduleGc()),c(se,this).notify({type:"observerRemoved",query:this,observer:e}))}getObserversCount(){return this.observers.length}invalidate(){this.state.isInvalidated||S(ue,this,me).call(this,{type:"invalidate"})}async fetch(e,t){if(this.state.fetchStatus!=="idle"&&c(K,this)?.status()!=="rejected"){if(this.state.data!==void 0&&t?.cancelRefetch)this.cancel({silent:!0});else if(c(K,this))return c(K,this).continueRetry(),c(K,this).promise}if(e&&this.setOptions(e),!this.options.queryFn){const l=this.observers.find(u=>u.options.queryFn);l&&this.setOptions(l.options)}const r=new AbortController,n=l=>{Object.defineProperty(l,"signal",{enumerable:!0,get:()=>(b(_t,this,!0),r.signal)})},s=()=>{const l=us(this.options,t),d=(()=>{const p={client:c(gt,this),queryKey:this.queryKey,meta:this.meta};return n(p),p})();return b(_t,this,!1),this.options.persister?this.options.persister(l,d,this):l(d)},a=(()=>{const l={fetchOptions:t,options:this.options,queryKey:this.queryKey,client:c(gt,this),state:this.state,fetchFn:s};return n(l),l})();(c(Ut,this)==="infinite"?Xi(this.options.pages):this.options.behavior)?.onFetch(a,this),b(Ht,this,this.state),(this.state.fetchStatus==="idle"||this.state.fetchMeta!==a.fetchOptions?.meta)&&S(ue,this,me).call(this,{type:"fetch",meta:a.fetchOptions?.meta});const o=b(K,this,ds({initialPromise:t?.initialPromise,fn:a.fetchFn,onCancel:l=>{l instanceof Br&&l.revert&&this.setState({...c(Ht,this),fetchStatus:"idle"}),r.abort()},onFail:(l,u)=>{S(ue,this,me).call(this,{type:"failed",failureCount:l,error:u})},onPause:()=>{S(ue,this,me).call(this,{type:"pause"})},onContinue:()=>{S(ue,this,me).call(this,{type:"continue"})},retry:a.options.retry,retryDelay:a.options.retryDelay,networkMode:a.options.networkMode,canRun:()=>!0}));try{const l=await o.start();if(l===void 0)throw new Error(`${this.queryHash} data is undefined`);return this.setData(l),c(se,this).config.onSuccess?.(l,this),c(se,this).config.onSettled?.(l,this.state.error,this),l}catch(l){if(l instanceof Br){if(l.silent)return c(K,this).promise;if(l.revert){if(this.state.data===void 0)throw l;return this.state.data}}throw S(ue,this,me).call(this,{type:"error",error:l}),c(se,this).config.onError?.(l,this),c(se,this).config.onSettled?.(this.state.data,l,this),l}finally{c(K,this)===o&&b(K,this,void 0),this.scheduleGc()}}};function me(e){const t=r=>{switch(e.type){case"failed":return{...r,fetchFailureCount:e.failureCount,fetchFailureReason:e.error};case"pause":return{...r,fetchStatus:"paused"};case"continue":return{...r,fetchStatus:"fetching"};case"fetch":return{...r,...gs(r.data,this.options),fetchMeta:e.meta??null};case"success":const n={...r,..._s(e.data,e.dataUpdatedAt),dataUpdateCount:r.dataUpdateCount+1,...!e.manual&&{fetchStatus:"idle",fetchFailureCount:0,fetchFailureReason:null}};return b(Ht,this,e.manual?n:void 0),n;case"error":const s=e.error;return{...r,error:s,errorUpdateCount:r.errorUpdateCount+1,errorUpdatedAt:Date.now(),fetchFailureCount:r.fetchFailureCount+1,fetchFailureReason:s,fetchStatus:"idle",status:"error",isInvalidated:!0};case"invalidate":return{...r,isInvalidated:!0};case"setState":return{...r,...e.state}}};this.state=t(this.state),U.batch(()=>{this.observers.slice().forEach(r=>{r.onQueryUpdate()}),c(se,this).notify({query:this,type:"updated",action:e})})}function gs(e,t){return{fetchFailureCount:0,fetchFailureReason:null,fetchStatus:hs(t.networkMode)?"fetching":"paused",...e===void 0&&{error:null,status:"pending"}}}function _s(e,t){return{data:e,dataUpdatedAt:t??Date.now(),error:null,isInvalidated:!1,status:"success"}}function ms(e){const t=typeof e.initialData=="function"?e.initialData():e.initialData,r=t!==void 0,n=r?typeof e.initialDataUpdatedAt=="function"?e.initialDataUpdatedAt():e.initialDataUpdatedAt:0;return{data:t,dataUpdateCount:0,dataUpdatedAt:r?n??Date.now():0,error:null,errorUpdateCount:0,errorUpdatedAt:0,fetchFailureCount:0,fetchFailureReason:null,fetchMeta:null,isInvalidated:!1,status:r?"success":"pending",fetchStatus:"idle"}}var X=new WeakMap,T=new WeakMap,Wr=new WeakMap,Y=new WeakMap,mt=new WeakMap,Kt=new WeakMap,Te=new WeakMap,Qr=new WeakMap,Zt=new WeakMap,Gt=new WeakMap,bt=new WeakMap,xt=new WeakMap,Ke=new WeakMap,Vt=new WeakMap,N=new WeakSet,ta=class extends je{constructor(e,t){super(),pt(this,N),w(this,X,void 0),w(this,T,void 0),w(this,Wr,void 0),w(this,Y,void 0),w(this,mt,void 0),w(this,Kt,void 0),w(this,Te,void 0),w(this,Qr,void 0),w(this,Zt,void 0),w(this,Gt,void 0),w(this,bt,void 0),w(this,xt,void 0),w(this,Ke,void 0),w(this,Vt,new Set),this.options=t,b(X,this,e),b(Te,this,null),this.bindMethods(),this.setOptions(t)}bindMethods(){this.refetch=this.refetch.bind(this)}onSubscribe(){this.listeners.size===1&&(c(T,this).addObserver(this),Ps(c(T,this),this.options)?S(N,this,Xt).call(this):this.updateResult(),S(N,this,ks).call(this))}onUnsubscribe(){this.hasListeners()||this.destroy()}shouldFetchOnReconnect(){return qr(c(T,this),this.options,this.options.refetchOnReconnect)}shouldFetchOnWindowFocus(){return qr(c(T,this),this.options,this.options.refetchOnWindowFocus)}destroy(){this.listeners=new Set,S(N,this,ws).call(this),S(N,this,Ss).call(this),c(T,this).removeObserver(this)}setOptions(e){const t=this.options,r=c(T,this);if(this.options=c(X,this).defaultQueryOptions(e),this.options.enabled!==void 0&&typeof this.options.enabled!="boolean"&&typeof this.options.enabled!="function"&&typeof B(this.options.enabled,c(T,this))!="boolean")throw new Error("Expected enabled to be a boolean or a callback that returns a boolean");S(N,this,$s).call(this),c(T,this).setOptions(this.options),t._defaulted&&!Nt(this.options,t)&&c(X,this).getQueryCache().notify({type:"observerOptionsUpdated",query:c(T,this),observer:this});const n=this.hasListeners();n&&Rs(c(T,this),r,this.options,t)&&S(N,this,Xt).call(this),this.updateResult(),n&&(c(T,this)!==r||B(this.options.enabled,c(T,this))!==B(t.enabled,c(T,this))||B(this.options.staleTime,c(T,this))!==B(t.staleTime,c(T,this)))&&S(N,this,xs).call(this);const s=S(N,this,vs).call(this);n&&(c(T,this)!==r||B(this.options.enabled,c(T,this))!==B(t.enabled,c(T,this))||s!==c(Ke,this))&&S(N,this,ys).call(this,s)}getOptimisticResult(e){const t=c(X,this).getQueryCache().build(c(X,this),e),r=this.createResult(t,e);return Nt(this.getCurrentResult(),r)||(b(Y,this,r),b(Kt,this,this.options),b(mt,this,c(T,this).state)),r}getCurrentResult(){return c(Y,this)}trackResult(e,t){return new Proxy(e,{get:(r,n)=>(this.trackProp(n),t?.(n),Reflect.get(r,n))})}trackProp(e){c(Vt,this).add(e)}getCurrentQuery(){return c(T,this)}refetch({...e}={}){return this.fetch({...e})}fetchOptimistic(e){const t=c(X,this).defaultQueryOptions(e),r=c(X,this).getQueryCache().build(c(X,this),t);let n=()=>{},s;const i=new Promise(a=>{s=a,n=c(X,this).getQueryCache().subscribe(o=>{o.type==="updated"&&o.query.queryHash===r.queryHash&&r.state.data!==void 0&&(n(),a(this.createResult(r,t)))})});return Promise.race([r.fetch().then(()=>{const a=this.createResult(r,t);return s?.(a),a}).finally(()=>{n()}),i])}fetch(e){return S(N,this,Xt).call(this,{...e,cancelRefetch:e.cancelRefetch??!0}).then(()=>(this.updateResult(),c(Y,this)))}createResult(e,t){const r=c(T,this),n=this.options,s=c(Y,this),i=c(mt,this),a=c(Kt,this),o=e!==r?e.state:c(Wr,this),{state:l}=e;let u={...l},d=!1,p;if(t._optimisticResults){const M=this.hasListeners(),Q=!M&&Ps(e,t),y=M&&Rs(e,r,t,n);(Q||y)&&(u={...u,...gs(l.data,e.options)}),t._optimisticResults==="isRestoring"&&(u.fetchStatus="idle")}let{error:h,errorUpdatedAt:f,status:_}=u;p=u.data;let v=!1;if(t.placeholderData!==void 0&&p===void 0&&_==="pending"){let M;s?.isPlaceholderData&&t.placeholderData===a?.placeholderData?(M=s.data,v=!0):M=typeof t.placeholderData=="function"?t.placeholderData(c(Gt,this)?.state.data,c(Gt,this)):t.placeholderData,M!==void 0&&(_="success",p=Or(s?.data,M,t),d=!0)}if(t.select&&p!==void 0&&!v)if(s&&p===i?.data&&t.select===c(Qr,this))p=c(Zt,this);else try{b(Qr,this,t.select),p=t.select(p),p=Or(s?.data,p,t),b(Zt,this,p),b(Te,this,null)}catch(M){b(Te,this,M)}else p===void 0&&b(Te,this,null);c(Te,this)&&(h=c(Te,this),p=c(Zt,this),f=Date.now(),_="error",d=!1);const m=u.fetchStatus==="fetching",k=_==="pending",x=_==="error",R=k&&m,I=p!==void 0;return{status:_,fetchStatus:u.fetchStatus,isPending:k,isSuccess:_==="success",isError:x,isInitialLoading:R,isLoading:R,data:p,dataUpdatedAt:u.dataUpdatedAt,error:h,errorUpdatedAt:f,failureCount:u.fetchFailureCount,failureReason:u.fetchFailureReason,errorUpdateCount:u.errorUpdateCount,isFetched:e.isFetched(),isFetchedAfterMount:u.dataUpdateCount>o.dataUpdateCount||u.errorUpdateCount>o.errorUpdateCount,isFetching:m,isRefetching:m&&!k,isLoadingError:x&&!I,isPaused:u.fetchStatus==="paused",isPlaceholderData:d,isRefetchError:x&&I,isStale:jr(e,t),refetch:this.refetch,isEnabled:B(t.enabled,e)!==!1}}updateResult(){const e=c(Y,this),t=this.createResult(c(T,this),this.options);if(b(mt,this,c(T,this).state),b(Kt,this,this.options),c(mt,this).data!==void 0&&b(Gt,this,c(T,this)),Nt(t,e))return;b(Y,this,t);const n=(()=>{if(!e)return!0;const{notifyOnChangeProps:s}=this.options,i=typeof s=="function"?s():s;if(i==="all"||!i&&!c(Vt,this).size)return!0;const a=new Set(i??c(Vt,this));return this.options.throwOnError&&a.add("error"),Object.keys(c(Y,this)).some(o=>{const l=o;return c(Y,this)[l]!==e[l]&&a.has(l)})})();U.batch(()=>{n&&this.listeners.forEach(s=>{s(c(Y,this))}),c(X,this).getQueryCache().notify({query:c(T,this),type:"observerResultsUpdated"})})}onQueryUpdate(){this.updateResult(),this.hasListeners()&&S(N,this,ks).call(this)}};function Xt(e){S(N,this,$s).call(this);let t=c(T,this).fetch(this.options,e);return e?.throwOnError||(t=t.catch(Z)),t}function bs(e){return!Lr()&&B(this.options.enabled,c(T,this))!==!1&&ns(e)}function xs(){S(N,this,ws).call(this);const e=B(this.options.staleTime,c(T,this));if(c(Y,this).isStale||!S(N,this,bs).call(this,e))return;const t=ss(c(Y,this).dataUpdatedAt,e)+1;b(bt,this,Ce.setTimeout(()=>{c(Y,this).isStale||this.updateResult()},t))}function vs(){return B(this.options.refetchInterval,c(T,this))??!1}function ys(e){S(N,this,Ss).call(this),b(Ke,this,e),!(c(Ke,this)===0||!S(N,this,bs).call(this,c(Ke,this)))&&b(xt,this,Ce.setInterval(()=>{(this.options.refetchIntervalInBackground||zr.isFocused())&&S(N,this,Xt).call(this)},c(Ke,this)))}function ks(){S(N,this,xs).call(this),S(N,this,ys).call(this,S(N,this,vs).call(this))}function ws(){c(bt,this)!==void 0&&(Ce.clearTimeout(c(bt,this)),b(bt,this,void 0))}function Ss(){c(xt,this)!==void 0&&(Ce.clearInterval(c(xt,this)),b(xt,this,void 0))}function $s(){const e=c(X,this).getQueryCache().build(c(X,this),this.options);if(e===c(T,this))return;const t=c(T,this);b(T,this,e),b(Wr,this,e.state),this.hasListeners()&&(t?.removeObserver(this),e.addObserver(this))}function ra(e,t){return B(t.enabled,e)!==!1&&e.state.data===void 0&&!(e.state.status==="error"&&B(t.retryOnMount,e)===!1)}function Ps(e,t){return ra(e,t)||e.state.data!==void 0&&qr(e,t,t.refetchOnMount)}function qr(e,t,r){if(B(t.enabled,e)!==!1&&B(t.staleTime,e)!=="static"){const n=B(r,e);return n==="always"||n!==!1&&jr(e,t)}return!1}function Rs(e,t,r,n){return(e!==t||B(n.enabled,e)===!1)&&(!r.suspense||e.state.status!=="error")&&jr(e,r)}function jr(e,t){return B(t.enabled,e)!==!1&&e.isStaleByTime(B(t.staleTime,e))}var na=class extends ta{constructor(e,t){super(e,t)}bindMethods(){super.bindMethods(),this.fetchNextPage=this.fetchNextPage.bind(this),this.fetchPreviousPage=this.fetchPreviousPage.bind(this)}setOptions(e){e._type="infinite",super.setOptions(e)}getOptimisticResult(e){return e._type="infinite",super.getOptimisticResult(e)}fetchNextPage(e){return this.fetch({...e,meta:{fetchMore:{direction:"forward"}}})}fetchPreviousPage(e){return this.fetch({...e,meta:{fetchMore:{direction:"backward"}}})}createResult(e,t){const{state:r}=e,n=super.createResult(e,t),{isFetching:s,isRefetching:i,isError:a,isRefetchError:o}=n,l=r.fetchMeta?.fetchMore?.direction,u=a&&l==="forward",d=s&&l==="forward",p=a&&l==="backward",h=s&&l==="backward";return{...n,fetchNextPage:this.fetchNextPage,fetchPreviousPage:this.fetchPreviousPage,hasNextPage:Yi(t,r.data),hasPreviousPage:Ji(t,r.data),isFetchNextPageError:u,isFetchingNextPage:d,isFetchPreviousPageError:p,isFetchingPreviousPage:h,isRefetchError:o&&!u&&!p,isRefetching:i&&!d&&!h}}},Ur=new WeakMap,be=new WeakMap,G=new WeakMap,vt=new WeakMap,xe=new WeakSet,sa=class extends ps{constructor(e){super(),pt(this,xe),w(this,Ur,void 0),w(this,be,void 0),w(this,G,void 0),w(this,vt,void 0),b(Ur,this,e.client),this.mutationId=e.mutationId,b(G,this,e.mutationCache),b(be,this,[]),this.state=e.state||Cs(),this.setOptions(e.options),this.scheduleGc()}setOptions(e){this.options=e,this.updateGcTime(this.options.gcTime)}get meta(){return this.options.meta}addObserver(e){c(be,this).includes(e)||(c(be,this).push(e),this.clearGcTimeout(),c(G,this).notify({type:"observerAdded",mutation:this,observer:e}))}removeObserver(e){b(be,this,c(be,this).filter(t=>t!==e)),this.scheduleGc(),c(G,this).notify({type:"observerRemoved",mutation:this,observer:e})}optionalRemove(){c(be,this).length||(this.state.status==="pending"?this.scheduleGc():c(G,this).remove(this))}continue(){return c(vt,this)?.continue()??(this.state.status==="pending"?this.execute(this.state.variables):Promise.resolve())}async execute(e){const t=()=>{S(xe,this,Ae).call(this,{type:"continue"})},r={client:c(Ur,this),meta:this.options.meta,mutationKey:this.options.mutationKey},n=b(vt,this,ds({fn:()=>this.options.mutationFn?this.options.mutationFn(e,r):Promise.reject(new Error("No mutationFn found")),onFail:(a,o)=>{S(xe,this,Ae).call(this,{type:"failed",failureCount:a,error:o})},onPause:()=>{S(xe,this,Ae).call(this,{type:"pause"})},onContinue:t,retry:this.options.retry??0,retryDelay:this.options.retryDelay,networkMode:this.options.networkMode,canRun:()=>c(G,this).canRun(this)})),s=this.state.status==="pending",i=!n.canStart();try{if(s)t();else{S(xe,this,Ae).call(this,{type:"pending",variables:e,isPaused:i}),c(G,this).config.onMutate&&await c(G,this).config.onMutate(e,this,r);const o=await this.options.onMutate?.(e,r);o!==this.state.context&&S(xe,this,Ae).call(this,{type:"pending",context:o,variables:e,isPaused:i})}const a=await n.start();return await c(G,this).config.onSuccess?.(a,e,this.state.context,this,r),await this.options.onSuccess?.(a,e,this.state.context,r),await c(G,this).config.onSettled?.(a,null,this.state.variables,this.state.context,this,r),await this.options.onSettled?.(a,null,e,this.state.context,r),S(xe,this,Ae).call(this,{type:"success",data:a}),a}catch(a){try{await c(G,this).config.onError?.(a,e,this.state.context,this,r)}catch(o){Promise.reject(o)}try{await this.options.onError?.(a,e,this.state.context,r)}catch(o){Promise.reject(o)}try{await c(G,this).config.onSettled?.(void 0,a,this.state.variables,this.state.context,this,r)}catch(o){Promise.reject(o)}try{await this.options.onSettled?.(void 0,a,e,this.state.context,r)}catch(o){Promise.reject(o)}throw S(xe,this,Ae).call(this,{type:"error",error:a}),a}finally{c(vt,this)===n&&b(vt,this,void 0),c(G,this).runNext(this)}}};function Ae(e){const t=r=>{switch(e.type){case"failed":return{...r,failureCount:e.failureCount,failureReason:e.error};case"pause":return{...r,isPaused:!0};case"continue":return{...r,isPaused:!1};case"pending":return{...r,context:e.context,data:void 0,failureCount:0,failureReason:null,error:null,isPaused:e.isPaused,status:"pending",variables:e.variables,submittedAt:Date.now()};case"success":return{...r,data:e.data,failureCount:0,failureReason:null,error:null,status:"success",isPaused:!1};case"error":return{...r,data:void 0,error:e.error,failureCount:r.failureCount+1,failureReason:e.error,isPaused:!1,status:"error"}}};this.state=t(this.state),U.batch(()=>{c(be,this).forEach(r=>{r.onMutationUpdate(e)}),c(G,this).notify({mutation:this,type:"updated",action:e})})}function Cs(){return{context:void 0,data:void 0,error:null,failureCount:0,failureReason:null,isPaused:!1,status:"idle",variables:void 0,submittedAt:0}}var Ie=new WeakMap,he=new WeakMap,Yt=new WeakMap,ia=class extends je{constructor(e={}){super(),w(this,Ie,void 0),w(this,he,void 0),w(this,Yt,void 0),this.config=e,b(Ie,this,new Set),b(he,this,new Map),b(Yt,this,0)}build(e,t,r){var n;const s=new sa({client:e,mutationCache:this,mutationId:b(Yt,this,(n=c(Yt,this),++n)),options:e.defaultMutationOptions(t),state:r});return this.add(s),s}add(e){c(Ie,this).add(e);const t=Jt(e);if(typeof t=="string"){const r=c(he,this).get(t);r?r.push(e):c(he,this).set(t,[e])}this.notify({type:"added",mutation:e})}remove(e){if(c(Ie,this).delete(e)){const t=Jt(e);if(typeof t=="string"){const r=c(he,this).get(t);if(r)if(r.length>1){const n=r.indexOf(e);n!==-1&&r.splice(n,1)}else r[0]===e&&c(he,this).delete(t)}}this.notify({type:"removed",mutation:e})}canRun(e){const t=Jt(e);if(typeof t=="string"){const r=c(he,this).get(t)?.find(n=>n.state.status==="pending");return!r||r===e}else return!0}runNext(e){const t=Jt(e);return typeof t=="string"?c(he,this).get(t)?.find(r=>r!==e&&r.state.isPaused)?.continue()??Promise.resolve():Promise.resolve()}clear(){U.batch(()=>{c(Ie,this).forEach(e=>{this.notify({type:"removed",mutation:e})}),c(Ie,this).clear(),c(he,this).clear()})}getAll(){return Array.from(c(Ie,this))}find(e){const t={exact:!0,...e};return this.getAll().find(r=>as(t,r))}findAll(e={}){return this.getAll().filter(t=>as(e,t))}notify(e){U.batch(()=>{this.listeners.forEach(t=>{t(e)})})}resumePausedMutations(){const e=this.getAll().filter(t=>t.state.isPaused);return U.batch(()=>Promise.all(e.map(t=>t.continue().catch(Z))))}};function Jt(e){return e.options.scope?.id}var Oe=new WeakMap,Ze=new WeakMap,V=new WeakMap,Ee=new WeakMap,Fe=new WeakSet,aa=class extends je{constructor(e,t){super(),pt(this,Fe),w(this,Oe,void 0),w(this,Ze,void 0),w(this,V,void 0),w(this,Ee,void 0),b(Oe,this,e),this.setOptions(t),this.bindMethods(),S(Fe,this,er).call(this)}bindMethods(){this.mutate=this.mutate.bind(this),this.reset=this.reset.bind(this)}setOptions(e){const t=this.options;this.options=c(Oe,this).defaultMutationOptions(e),Nt(this.options,t)||c(Oe,this).getMutationCache().notify({type:"observerOptionsUpdated",mutation:c(V,this),observer:this}),t?.mutationKey&&this.options.mutationKey&&Me(t.mutationKey)!==Me(this.options.mutationKey)?this.reset():c(V,this)?.state.status==="pending"&&c(V,this).setOptions(this.options)}onSubscribe(){this.listeners.size===1&&c(V,this)&&(c(V,this).addObserver(this),S(Fe,this,er).call(this))}onUnsubscribe(){this.hasListeners()||c(V,this)?.removeObserver(this)}onMutationUpdate(e){S(Fe,this,er).call(this),S(Fe,this,Ms).call(this,e)}getCurrentResult(){return c(Ze,this)}reset(){c(V,this)?.removeObserver(this),b(V,this,void 0),S(Fe,this,er).call(this),S(Fe,this,Ms).call(this)}mutate(e,t){return b(Ee,this,t),c(V,this)?.removeObserver(this),b(V,this,c(Oe,this).getMutationCache().build(c(Oe,this),this.options)),c(V,this).addObserver(this),c(V,this).execute(e)}};function er(){const e=c(V,this)?.state??Cs();b(Ze,this,{...e,isPending:e.status==="pending",isSuccess:e.status==="success",isError:e.status==="error",isIdle:e.status==="idle",mutate:this.mutate,reset:this.reset})}function Ms(e){U.batch(()=>{if(c(Ee,this)&&this.hasListeners()){const t=c(Ze,this).variables,r=c(Ze,this).context,n={client:c(Oe,this),meta:this.options.meta,mutationKey:this.options.mutationKey};if(e?.type==="success"){try{c(Ee,this).onSuccess?.(e.data,t,r,n)}catch(s){Promise.reject(s)}try{c(Ee,this).onSettled?.(e.data,null,t,r,n)}catch(s){Promise.reject(s)}}else if(e?.type==="error"){try{c(Ee,this).onError?.(e.error,t,r,n)}catch(s){Promise.reject(s)}try{c(Ee,this).onSettled?.(void 0,e.error,t,r,n)}catch(s){Promise.reject(s)}}}this.listeners.forEach(t=>{t(c(Ze,this))})})}var ve=new WeakMap,oa=class extends je{constructor(e={}){super(),w(this,ve,void 0),this.config=e,b(ve,this,new Map)}build(e,t,r){const n=t.queryKey,s=t.queryHash??Ar(n,t);let i=this.get(s);return i||(i=new ea({client:e,queryKey:n,queryHash:s,options:e.defaultQueryOptions(t),state:r,defaultOptions:e.getQueryDefaults(n)}),this.add(i)),i}add(e){c(ve,this).has(e.queryHash)||(c(ve,this).set(e.queryHash,e),this.notify({type:"added",query:e}))}remove(e){c(ve,this).get(e.queryHash)===e&&(e.destroy(),c(ve,this).delete(e.queryHash),this.notify({type:"removed",query:e}))}clear(){U.batch(()=>{this.getAll().forEach(e=>{this.remove(e)})})}get(e){return c(ve,this).get(e)}getAll(){return[...c(ve,this).values()]}find(e){const t={exact:!0,...e};return this.getAll().find(r=>is(t,r))}findAll(e={}){const t=this.getAll();return Object.keys(e).length>0?t.filter(r=>is(e,r)):t}notify(e){U.batch(()=>{this.listeners.forEach(t=>{t(e)})})}onFocus(){U.batch(()=>{this.getAll().forEach(e=>{e.onFocus()})})}onOnline(){U.batch(()=>{this.getAll().forEach(e=>{e.onOnline()})})}},W=new WeakMap,Ge=new WeakMap,Ve=new WeakMap,tr=new WeakMap,rr=new WeakMap,ye=new WeakMap,nr=new WeakMap,sr=new WeakMap,la=class{constructor(e={}){w(this,W,void 0),w(this,Ge,void 0),w(this,Ve,void 0),w(this,tr,void 0),w(this,rr,void 0),w(this,ye,void 0),w(this,nr,void 0),w(this,sr,void 0),b(W,this,e.queryCache||new oa),b(Ge,this,e.mutationCache||new ia),b(Ve,this,e.defaultOptions||{}),b(tr,this,new Map),b(rr,this,new Map),b(ye,this,0)}mount(){var e;b(ye,this,(e=c(ye,this),e++,e)),c(ye,this)===1&&(b(nr,this,zr.subscribe(async t=>{t&&(await this.resumePausedMutations(),c(W,this).onFocus())})),b(sr,this,jt.subscribe(async t=>{t&&(await this.resumePausedMutations(),c(W,this).onOnline())})))}unmount(){var e;b(ye,this,(e=c(ye,this),e--,e)),c(ye,this)===0&&(c(nr,this)?.call(this),b(nr,this,void 0),c(sr,this)?.call(this),b(sr,this,void 0))}isFetching(e){return c(W,this).findAll({...e,fetchStatus:"fetching"}).length}isMutating(e){return c(Ge,this).findAll({...e,status:"pending"}).length}getQueryData(e){const t=this.defaultQueryOptions({queryKey:e});return c(W,this).get(t.queryHash)?.state.data}ensureQueryData(e){const t=this.defaultQueryOptions(e),r=c(W,this).build(this,t),n=r.state.data;return n===void 0?this.fetchQuery(e):(e.revalidateIfStale&&r.isStaleByTime(B(t.staleTime,r))&&this.prefetchQuery(t),Promise.resolve(n))}getQueriesData(e){return c(W,this).findAll(e).map(({queryKey:t,state:r})=>[t,r.data])}setQueryData(e,t,r){const n=this.defaultQueryOptions({queryKey:e}),s=c(W,this).get(n.queryHash)?.state.data,i=Di(t,s);if(i!==void 0)return c(W,this).build(this,n).setData(i,{...r,manual:!0})}setQueriesData(e,t,r){return U.batch(()=>c(W,this).findAll(e).map(({queryKey:n})=>[n,this.setQueryData(n,t,r)]))}getQueryState(e){const t=this.defaultQueryOptions({queryKey:e});return c(W,this).get(t.queryHash)?.state}removeQueries(e){const t=c(W,this);U.batch(()=>{t.findAll(e).forEach(r=>{t.remove(r)})})}resetQueries(e,t){const r=c(W,this);return U.batch(()=>{const n=r.findAll(e),s=new Set(n);return n.forEach(i=>{i.reset()}),this.refetchQueries({type:"active",predicate:i=>s.has(i)},t)})}cancelQueries(e,t={}){const r={revert:!0,...t},n=U.batch(()=>c(W,this).findAll(e).map(s=>s.cancel(r)));return Promise.all(n).then(Z).catch(Z)}invalidateQueries(e,t={}){return U.batch(()=>(c(W,this).findAll(e).forEach(r=>{r.invalidate()}),e?.refetchType==="none"?Promise.resolve():this.refetchQueries({...e,type:e?.refetchType??e?.type??"active"},t)))}refetchQueries(e,t={}){const r={...t,cancelRefetch:t.cancelRefetch??!0},n=U.batch(()=>c(W,this).findAll(e).filter(s=>!s.isDisabled()&&!s.isStatic()).map(s=>{let i=s.fetch(void 0,r);return r.throwOnError||(i=i.catch(Z)),s.state.fetchStatus==="paused"?Promise.resolve():i}));return Promise.all(n).then(Z)}async query(e){const t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);const r=c(W,this).build(this,t),n=r.isStaleByTime(B(t.staleTime,r))?await r.fetch(t):r.state.data,s=t.select;return s?s(n):n}fetchQuery(e){const t=this.defaultQueryOptions(e);t.retry===void 0&&(t.retry=!1);const r=c(W,this).build(this,t);return r.isStaleByTime(B(t.staleTime,r))?r.fetch(t):Promise.resolve(r.state.data)}prefetchQuery(e){return this.fetchQuery(e).then(Z).catch(Z)}infiniteQuery(e){return e._type="infinite",this.query(e)}fetchInfiniteQuery(e){return e._type="infinite",this.fetchQuery(e)}prefetchInfiniteQuery(e){return this.fetchInfiniteQuery(e).then(Z).catch(Z)}ensureInfiniteQueryData(e){return e._type="infinite",this.ensureQueryData(e)}resumePausedMutations(){return jt.isOnline()?c(Ge,this).resumePausedMutations():Promise.resolve()}getQueryCache(){return c(W,this)}getMutationCache(){return c(Ge,this)}getDefaultOptions(){return c(Ve,this)}setDefaultOptions(e){b(Ve,this,e)}setQueryDefaults(e,t){c(tr,this).set(Me(e),{queryKey:e,defaultOptions:t})}getQueryDefaults(e){const t=[...c(tr,this).values()],r={};return t.forEach(n=>{qe(e,n.queryKey)&&Object.assign(r,n.defaultOptions)}),r}setMutationDefaults(e,t){c(rr,this).set(Me(e),{mutationKey:e,defaultOptions:t})}getMutationDefaults(e){const t=[...c(rr,this).values()],r={};return t.forEach(n=>{qe(e,n.mutationKey)&&Object.assign(r,n.defaultOptions)}),r}defaultQueryOptions(e){if(e._defaulted)return e;const t={...c(Ve,this).queries,...this.getQueryDefaults(e.queryKey),...e,_defaulted:!0};return t.queryHash||(t.queryHash=Ar(t.queryKey,t)),t.refetchOnReconnect===void 0&&(t.refetchOnReconnect=t.networkMode!=="always"),t.throwOnError===void 0&&(t.throwOnError=!!t.suspense),!t.networkMode&&t.persister&&(t.networkMode="offlineFirst"),t.queryFn===Er&&(t.enabled=!1),t}defaultMutationOptions(e){return e?._defaulted?e:{...c(Ve,this).mutations,...e?.mutationKey&&this.getMutationDefaults(e.mutationKey),...e,_defaulted:!0}}clear(){c(W,this).clear(),c(Ge,this).clear()}},Ts=wr(!1),ca=()=>$r(Ts),rl=Ts.Provider;function ua(){let e=!1;return{clearReset:()=>{e=!1},reset:()=>{e=!0},isReset:()=>e}}var ha=wr(ua()),da=()=>$r(ha),pa=(e,t,r)=>{const n=r?.state.error&&typeof e.throwOnError=="function"?Fr(e.throwOnError,[r.state.error,r]):e.throwOnError;(e.suspense||n)&&(t.isReset()||(e.retryOnMount=!1))},fa=e=>{ce(()=>{e.clearReset()},[e])},ga=({result:e,errorResetBoundary:t,throwOnError:r,query:n,suspense:s})=>e.isError&&!t.isReset()&&!e.isFetching&&n&&(s&&e.data===void 0||Fr(r,[e.error,n])),_a=e=>{if(e.suspense){const r=s=>s==="static"?s:Math.max(s??1e3,1e3),n=e.staleTime;e.staleTime=typeof n=="function"?(...s)=>r(n(...s)):r(n),typeof e.gcTime=="number"&&(e.gcTime=Math.max(e.gcTime,1e3))}},ma=(e,t)=>e?.suspense&&t.isPending,ba=(e,t,r)=>t.fetchOptimistic(e).catch(()=>{r.clearReset()});function xa(e,t,r){const n=ca(),s=da(),i=Tr(r),a=i.defaultQueryOptions(e),o=i.getQueryCache().get(a.queryHash),l=e.subscribed!==!1;a._optimisticResults=n?"isRestoring":l?"optimistic":void 0,_a(a),pa(a,s,o),fa(s);const[u]=le(()=>new t(i,a)),d=u.getOptimisticResult(a),p=!n&&l;if(Wn(Pe(h=>{const f=p?u.subscribe(U.batchCalls(h)):Z;return u.updateResult(),f},[u,p]),()=>u.getCurrentResult(),()=>u.getCurrentResult()),ce(()=>{u.setOptions(a)},[a,u]),ma(a,d))throw ba(a,u,s);if(ga({result:d,errorResetBoundary:s,throwOnError:a.throwOnError,query:o,suspense:a.suspense}))throw d.error;return a.notifyOnChangeProps?d:u.trackResult(d)}function va(e,t){const r=Tr(t),[n]=le(()=>new aa(r,e));ce(()=>{n.setOptions(e)},[n,e]);const s=Wn(Pe(a=>n.subscribe(U.batchCalls(a)),[n]),()=>n.getCurrentResult(),()=>n.getCurrentResult()),i=Pe((...a)=>{n.mutate(a[0],a[1]).catch(Z)},[n]);if(s.error&&Fr(n.options.throwOnError,[s.error]))throw s.error;return{...s,mutate:i,mutateAsync:s.mutate}}function ya(e,t){return xa(e,na,t)}var ka=6048e5;function Hr(e,t){return`schedulux_sess_${e}_${t}`}function Kr(e,t){try{const r=localStorage.getItem(Hr(e,t));if(!r)return null;const n=JSON.parse(r);return n.timestamp&&Date.now()-n.timestamp>ka?(Is(e,t),null):n}catch{return null}}function As(e,t,r){try{const n={...r,timestamp:r.timestamp||Date.now()};localStorage.setItem(Hr(e,t),JSON.stringify(n))}catch{}}function Is(e,t){try{localStorage.removeItem(Hr(e,t))}catch{}}async function Os(e,t,r,n="live"){const s=Kr(t,r),i=e.replace(/\/+$/,""),a=n==="sandbox"?`${i}/api/v1/tenant/knowledge/onboarding/sandbox/init`:`${i}/api/v1/public/chat/init`,o={tenant_id:t,agent_id:r};s?.sessionId&&(o.session_id=s.sessionId),s?.token&&(o.token=s.token);const l=await fetch(a,{method:"POST",headers:{"Content-Type":"application/json"},credentials:n==="sandbox"?"include":"same-origin",body:JSON.stringify(o)});if(!l.ok)throw new Error(`Init failed with status: ${l.status}`);const u=(await l.json()).data||{};As(t,r,{sessionId:u.session_id,token:u.token});const d=(u.messages||[]).map((p,h)=>({id:`init_${h}`,role:p.role==="user"?"user":"agent",content:p.content||p.text||"",created_at:p.created_at||new Date().toISOString()}));return{sessionId:u.session_id,token:u.token,isFirstTime:!!u.is_first_time,messages:d}}async function wa(e,t,r,n,s,i,a,o,l="live"){const u=e.replace(/\/+$/,""),d=l==="sandbox"?`${u}/api/v1/tenant/knowledge/onboarding/sandbox`:`${u}/api/v1/public/chat`,p={tenant_id:t,agent_id:r,session_id:n,token:s,message:i};a&&(p.customer_name=a),o&&(p.customer_phone=o);const h=await fetch(d,{method:"POST",headers:{"Content-Type":"application/json"},credentials:l==="sandbox"?"include":"same-origin",body:JSON.stringify(p)});if(!h.ok){const _=await h.text().catch(()=>"");throw new Error(`Message failed (${h.status}): ${_||h.statusText}`)}const f=(await h.json()).data||{};return f.token&&As(t,r,{sessionId:f.session_id||n,token:f.token}),{response:f.response||f.reply||"",sessionId:f.session_id||n,token:f.token||s,user_message_id:f.user_message_id||void 0,agent_message_id:f.agent_message_id||void 0,created_at:f.created_at||void 0,booking_id:f.booking_id||void 0,booking_reference:f.booking_reference||void 0,status:f.status||void 0}}async function Sa(e,t,r,n="live"){const s=e.replace(/\/+$/,""),i=n==="sandbox"?`${s}/api/v1/tenant/knowledge/onboarding/sandbox/config?tenant_id=${encodeURIComponent(t)}&agent_id=${encodeURIComponent(r)}`:`${s}/api/v1/public/chat/config?tenant_id=${encodeURIComponent(t)}&agent_id=${encodeURIComponent(r)}`,a=await fetch(i,{method:"GET",headers:{Accept:"application/json"},credentials:n==="sandbox"?"include":"same-origin"});if(!a.ok)throw new Error(`Widget config fetch failed (${a.status}): ${a.statusText}`);return(await a.json()).data?.widget_config||{}}async function $a({apiBase:e,tenantId:t,agentId:r,sessionId:n,token:s,before:i,limit:a=20,mode:o="live"}){const l=e.replace(/\/+$/,""),u=new URLSearchParams;u.append("tenant_id",t),u.append("agent_id",r),n&&u.append("session_id",n),s&&u.append("token",s),i&&u.append("before",i),u.append("limit",String(a));const d=o==="sandbox"?`${l}/api/v1/tenant/knowledge/onboarding/sandbox/messages?${u.toString()}`:`${l}/api/v1/public/chat/messages?${u.toString()}`,p=await fetch(d,{method:"GET",headers:{Accept:"application/json"},credentials:o==="sandbox"?"include":"same-origin"});if(!p.ok){const f=await p.text().catch(()=>"");throw new Error(`Fetch messages failed (${p.status}): ${f||p.statusText}`)}const h=(await p.json()).data||{};return{messages:(h.messages||[]).map((f,_)=>({id:f.id||f.message_id||`msg_${Date.now()}_${_}`,role:f.role==="user"?"user":"agent",content:f.content||f.text||"",created_at:f.created_at||new Date().toISOString(),booking_id:f.booking_id,booking_reference:f.booking_reference,status:f.status})),next_cursor:h.next_cursor||null,has_more:!!h.has_more}}var Zr={all:["schedulux-widget"],messages:(e,t,r,n)=>[...Zr.all,"messages",e,t,r,n??""]};function Pa({options:e,config:t}){const r=Tr(),[n,s]=le(()=>Kr(e.tenantId,e.agentId)?.sessionId||""),[i,a]=le(()=>Kr(e.tenantId,e.agentId)?.token),[o,l]=le(!1),[u,d]=le(!1),p=t.initial_greeting||"Hi there! How can I assist you with scheduling today?",h=e.mode||"live",f=ut(()=>Zr.messages(h,e.tenantId,e.agentId,n),[h,e.tenantId,e.agentId,n]);ce(()=>{let y=!1;return(async()=>{l(!0);try{const L=await Os(e.apiBase||"",e.tenantId,e.agentId,h);y||(s(L.sessionId),a(L.token))}catch(L){console.warn("[Schedulux Widget] Session init fallback:",L)}finally{y||l(!1)}})(),()=>{y=!0}},[e.apiBase,e.tenantId,e.agentId,h]);const{data:_,fetchPreviousPage:v,hasPreviousPage:m,isFetchingPreviousPage:k,isLoading:x}=ya({queryKey:f,queryFn:async({pageParam:y})=>n?$a({apiBase:e.apiBase||"",tenantId:e.tenantId,agentId:e.agentId,sessionId:n,token:i,before:y,limit:20,mode:h}):{messages:[],next_cursor:null,has_more:!1},initialPageParam:void 0,getPreviousPageParam:y=>y.has_more&&y.next_cursor?y.next_cursor:void 0,getNextPageParam:()=>{},enabled:!!n,staleTime:3e5,refetchOnWindowFocus:!1}),R=ut(()=>{const y=_?.pages?_.pages.flatMap(C=>C.messages):[];if(y.length===0)return[{id:"welcome",role:"agent",content:p,created_at:new Date().toISOString()}];const E=new Set,L=[];for(const C of y){if(C.id){if(E.has(C.id))continue;E.add(C.id)}L.push(C)}return L},[_?.pages,p]),I=va({mutationFn:async y=>{if(e.onSendMessage){const E=await e.onSendMessage(y);return{response:E.response,sessionId:n,token:i,booking_id:E.booking_id,booking_reference:E.booking_reference,status:E.status}}return wa(e.apiBase||"",e.tenantId,e.agentId,n,i,y,e.customerName,e.customerPhone,h)},onMutate:async y=>{d(!0);const E=`temp_${Date.now()}`,L={id:E,role:"user",content:y,created_at:new Date().toISOString(),delivery_status:"pending"};return r.setQueryData(f,C=>{if(!C||C.pages.length===0)return{pageParams:[void 0],pages:[{messages:[L],next_cursor:null,has_more:!1}]};const q=C.pages.length-1,F={...C.pages[q],messages:[...C.pages[q].messages,L]},te=[...C.pages];return te[q]=F,{...C,pages:te}}),{tempId:E}},onSuccess:(y,E,L)=>{const C=!!(y.sessionId&&y.sessionId!==n);C&&y.sessionId&&s(y.sessionId),y.token&&a(y.token);const q=y.response||"I would be happy to help you with that!",F={id:y.agent_message_id||`agent_${Date.now()}`,role:"agent",content:q,created_at:y.created_at||new Date().toISOString(),booking_id:y.booking_id,booking_reference:y.booking_reference,status:y.status,delivery_status:"sent"},te=ee=>{if(!ee||ee.pages.length===0)return{pageParams:[void 0],pages:[{messages:[F],next_cursor:null,has_more:!1}]};const fe=ee.pages.length-1,Mt=ee.pages[fe],Ne=Mt.messages.map(ge=>L?.tempId&&ge.id===L.tempId?{...ge,id:y.user_message_id||ge.id,delivery_status:"sent"}:ge);Ne.some(ge=>ge.id===F.id||ge.role==="agent"&&ge.content===F.content&&Math.abs(new Date(ge.created_at||0).getTime()-new Date(F.created_at||0).getTime())<3e3)||Ne.push(F);const Jo={...Mt,messages:Ne},di=[...ee.pages];return di[fe]=Jo,{...ee,pages:di}};if(C&&y.sessionId){const ee=Zr.messages(h,e.tenantId,e.agentId,y.sessionId),fe=r.getQueryData(f);r.setQueryData(ee,te(fe))}else r.setQueryData(f,te);y.booking_reference&&e.onBookingConfirmed?.({booking_id:y.booking_id,booking_reference:y.booking_reference,status:y.status})},onError:(y,E,L)=>{console.error("[Schedulux Widget] Message error:",y),r.setQueryData(f,F=>{if(!F||F.pages.length===0)return F;const te=F.pages.length-1,ee=F.pages[te],fe=ee.messages.map(Ne=>L?.tempId&&Ne.id===L.tempId?{...Ne,delivery_status:"error"}:Ne),Mt=[...F.pages];return Mt[te]={...ee,messages:fe},{...F,pages:Mt}});const C=t.fallback_message||"I apologize, but I am having trouble connecting to the booking server. Please try again shortly or contact support.",q={id:`err_${Date.now()}`,role:"agent",content:C,created_at:new Date().toISOString(),delivery_status:"error"};r.setQueryData(f,F=>{if(!F||F.pages.length===0)return F;const te=F.pages.length-1,ee={...F.pages[te],messages:[...F.pages[te].messages,q]},fe=[...F.pages];return fe[te]=ee,{...F,pages:fe}})},onSettled:()=>{d(!1)}}),M=Pe(async y=>{!y.trim()||u||!n||await I.mutateAsync(y.trim())},[u,n,I]),Q=Pe(async()=>{Is(e.tenantId,e.agentId),r.removeQueries({queryKey:f}),s(""),a(void 0),l(!0);try{const y=await Os(e.apiBase||"",e.tenantId,e.agentId,h);s(y.sessionId),a(y.token)}finally{l(!1)}e.onReset?.()},[e.tenantId,e.agentId,e.apiBase,h,r,f,e.onReset]);return{messages:R,isTyping:u,isLoadingMessages:x,isInitializing:o,hasOlderMessages:!!m,isFetchingOlderMessages:k,loadOlderMessages:v,sendMessage:M,resetSession:Q}}function Ra({className:e="",size:t=20}){return g("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:g("path",{d:"M7.9 20A9 9 0 1 0 4 16.1L2 22Z"})})}function Ca({className:e="",size:t=20}){return g("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[g("path",{d:"M8 2v4"}),g("path",{d:"M16 2v4"}),g("rect",{width:"18",height:"18",x:"3",y:"4",rx:"2"}),g("path",{d:"M3 10h18"})]})}function Ma({className:e="",size:t=20}){return g("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[g("circle",{cx:"12",cy:"12",r:"10"}),g("path",{d:"M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"}),g("path",{d:"M12 17h.01"})]})}function Ta({className:e="",size:t=18}){return g("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[g("path",{d:"m22 2-7 20-4-9-9-4Z"}),g("path",{d:"M22 2 11 13"})]})}function Es({className:e="",size:t=18}){return g("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[g("path",{d:"M18 6 6 18"}),g("path",{d:"m6 6 12 12"})]})}function Aa({className:e="",size:t=16}){return g("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[g("path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"}),g("path",{d:"M21 3v5h-5"}),g("path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"}),g("path",{d:"M8 16H3v5"})]})}function Ia({className:e="",size:t=18}){return g("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[g("circle",{cx:"12",cy:"12",r:"10"}),g("path",{d:"m9 12 2 2 4-4"})]})}function Oa({className:e="",size:t=18}){return g("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"2",strokeLinecap:"round",strokeLinejoin:"round",className:e,children:[g("path",{d:"M12 8V4H8"}),g("rect",{width:"16",height:"12",x:"4",y:"8",rx:"2"}),g("path",{d:"M2 14h2"}),g("path",{d:"M20 14h2"}),g("path",{d:"M15 13v2"}),g("path",{d:"M9 13v2"})]})}function yt(e){"@babel/helpers - typeof";return yt=typeof Symbol=="function"&&typeof Symbol.iterator=="symbol"?function(t){return typeof t}:function(t){return t&&typeof Symbol=="function"&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},yt(e)}function Ea(e,t){if(yt(e)!="object"||!e)return e;var r=e[Symbol.toPrimitive];if(r!==void 0){var n=r.call(e,t||"default");if(yt(n)!="object")return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return(t==="string"?String:Number)(e)}function Fa(e){var t=Ea(e,"string");return yt(t)=="symbol"?t:t+""}function O(e,t,r){return(t=Fa(t))in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}var kt,ir;function Gr(){return{async:!1,breaks:!1,extensions:null,gfm:!0,hooks:null,pedantic:!1,renderer:null,silent:!1,tokenizer:null,walkTokens:null}}var Le=Gr();function Fs(e){Le=e}var ze={exec:()=>null};function Be(e){let t=[];return r=>{let n=Math.max(0,Math.min(3,r-1)),s=t[n];return s||(s=e(n),t[n]=s),s}}function $(e,t=""){let r=typeof e=="string"?e:e.source,n={replace:(s,i)=>{let a=typeof i=="string"?i:i.source;return a=a.replace(H.caret,"$1"),r=r.replace(s,a),n},getRegex:()=>new RegExp(r,t)};return n}var Ls=((e="")=>{try{return!!new RegExp("(?<=1)(?<!1)"+e)}catch{return!1}})(),H={codeRemoveIndent:/^(?: {0,3}\t| {1,4})/gm,outputLinkReplace:/\\([\[\]])/g,indentCodeCompensation:/^(\s+)(?:```)/,beginningSpace:/^\s+/,endingHash:/#$/,startingSpaceChar:/^ /,endingSpaceChar:/ $/,endingSpaceTabChar:/[ \t]$/,nonSpaceChar:/[^ ]/,newLineCharGlobal:/\n/g,tabCharGlobal:/\t/g,leadingSpaceTab:/^[ \t]+/,multipleSpaceGlobal:/\s+/g,blankLine:/^[ \t]*$/,doubleBlankLine:/\n[ \t]*\n[ \t]*$/,blockquoteStart:/^ {0,3}>/,blockquoteSetextReplace:/\n {0,3}((?:=+|-+)[ \t]*)(?=\n|$)/g,blockquoteSetextReplace2:/^ {0,3}>[ \t]?/gm,blockquoteMarkerWhitespace:/^( {0,3}>)([ \t]+)/gm,listReplaceNesting:/^ {1,4}(?=( {4})*[^ ])/g,listIsTask:/^\[[ xX]\][ \t]+\S/,listReplaceTask:/^\[[ xX]\][ \t]+/,listTaskCheckbox:/\[[ xX]\]/,anyLine:/\n.*\n/,hrefBrackets:/^<(.*)>$/,tableDelimiter:/[:|]/,tableAlignChars:/^\||\| *$/g,tableRowBlankLine:/\n[ \t]*$/,tableAlignRight:/^ *-+: *$/,tableAlignCenter:/^ *:-+: *$/,tableAlignLeft:/^ *:-+ *$/,startATag:/^<a /i,endATag:/^<\/a>/i,startPreScriptTag:/^<(pre|code|kbd|script)(\s|>)/i,endPreScriptTag:/^<\/(pre|code|kbd|script)(\s|>)/i,startAngleBracket:/^</,endAngleBracket:/>$/,pedanticHrefTitle:/^([^'"]*[^\s])\s+(['"])(.*)\2/,unicodeAlphaNumeric:/[\p{L}\p{N}]/u,numericCharacterReference:/&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));/,numericCharacterReferenceOrAmpersand:/&#(?:(\d{1,7})|[Xx]([A-Fa-f0-9]{1,6}));|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,escapeTest:/[&<>"']/,escapeReplace:/[&<>"']/g,escapeTestNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,escapeReplaceNoEncode:/[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,caret:/(^|[^\[])\^/g,percentDecode:/%25/g,findPipe:/\|/g,splitPipe:/ \|/,slashPipe:/\\\|/g,carriageReturn:/\r\n|\r/g,spaceLine:/^ +$/gm,notSpaceStart:/^\S*/,endingNewline:/\n$/,listItemRegex:e=>new RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),nextBulletRegex:Be(e=>new RegExp(`^ {0,${e}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`)),hrRegex:Be(e=>new RegExp(`^ {0,${e}}((?:-[ 	]*){3,}|(?:_[ 	]*){3,}|(?:\\*[ 	]*){3,})(?:\\n+|$)`)),fencesBeginRegex:Be(e=>new RegExp(`^ {0,${e}}(?:\`\`\`|~~~)`)),headingBeginRegex:Be(e=>new RegExp(`^ {0,${e}}#{1,6}(?:\\s|$)`)),pedanticHeadingBeginRegex:Be(e=>new RegExp(`^ {0,${e}}#`)),htmlBeginRegex:Be(e=>new RegExp(`^ {0,${e}}(?:</?(?:${St})(?: +|$|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)`,"i")),blockquoteBeginRegex:Be(e=>new RegExp(`^ {0,${e}}>`))},La=/^(?:[ \t]*(?:\n|$))+/,za=/^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,Ba=/^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}(?:(?=`)\1`*|(?=~)\1~*) *(?=\n|$)|$)/,wt=/^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,Da=/^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,Vr=/ {0,3}(?:[*+-]|\d{1,9}[.)])/,zs=/^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |fences|blockquote|heading|hr|html|table))+?)\n {0,3}(=+|-+)[ \t]*(?:\n+|$)/,Bs=$(zs).replace(/bull/g,Vr).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}(?:\s|$)/).replace(/hr/g,/ {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/\|table/g,"").getRegex(),Na=$(zs).replace(/bull/g,Vr).replace(/blockCode/g,/(?: {4}| {0,3}\t)/).replace(/fences/g,/ {0,3}(?:`{3,}|~{3,})/).replace(/blockquote/g,/ {0,3}>/).replace(/heading/g,/ {0,3}#{1,6}(?:\s|$)/).replace(/hr/g,/ {0,3}(?:(?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/).replace(/html/g,/ {0,3}<[^\n>]+>\n/).replace(/table/g,/ {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/).getRegex(),Xr=/^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table|[ \t]+\n)[^\n]+)*)/,Wa=/^[^\n]+/,Yr=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\\n]|\n(?![ \t]*\n))+/,Qa=$(/^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/).replace("label",Yr).replace("title",/(?:"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\\n]|\n(?!\n))*'|\((?:\\[\s\S]|[^()\\])*\))/).getRegex(),qa=$(/^(bull)([ \t][^\n]*?)?(?:\n|$)/).replace(/bull/g,Vr).getRegex(),St="address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul",Jr=/<!--(?:-?>|[\s\S]*?(?:-->|$))/,ja=$("^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n*|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>[^\\n]*\\n*|$)|<![A-Z][\\s\\S]*?(?:>[^\\n]*\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>[^\\n]*\\n*|$)|</?(tag)(?:[ \\t]+|\\n|/?>|$)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!(?:script|pre|style|textarea)(?![a-z0-9-]))([a-z][a-z0-9-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</[a-z][a-z0-9-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))","i").replace("comment",Jr).replace("tag",St).replace("attribute",/ +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/).getRegex(),Ds=e=>$(Xr).replace("hr",wt).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("|table","").replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list",e).replace("html"," {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag",St).getRegex(),Ua=Ds(/ {0,3}(?:[*+-]|1[.)])[ \t]+[^ \t\n]/),Ha=Ds(/ {0,3}(?:[*+-]|\d{1,9}[.)])(?:[ \t]|\n|$)/),en={blockquote:$(/^( {0,3}> ?(?:(?![ \t]*(?:\n|$))(paragraph)|[^\n]*)(?:\n|$))+/).replace("paragraph",Ha).getRegex(),code:za,def:Qa,fences:Ba,heading:Da,hr:wt,html:ja,lheading:Bs,list:qa,newline:La,paragraph:Ua,table:ze,text:Wa},Ns=$("^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)").replace("hr",wt).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("blockquote"," {0,3}>").replace("code","(?: {4}| {0,3}	)[^\\n]").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]").replace("html"," {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag",St).getRegex(),Ka={...en,lheading:Na,table:Ns,paragraph:$(Xr).replace("hr",wt).replace("heading"," {0,3}#{1,6}(?:\\s|$)").replace("|lheading","").replace("table",Ns).replace("blockquote"," {0,3}>").replace("fences"," {0,3}(?:`{3,}(?=[^`\\n]*(?:\\n|$))|~~~)[^\\n]*(?:\\n|$)").replace("list"," {0,3}(?:[*+-]|1[.)])[ \\t]+[^ \\t\\n]").replace("html"," {0,3}(?:</?(?:tag)(?: +|\\n|/?>)|<(?:(?:script|pre|style|textarea)(?:[\\s>]|$)|!--)|<\\?|<![A-Za-z]|<!\\[CDATA\\[)").replace("tag",St).getRegex()},Za={...en,html:$(`^ *(?:comment(?: *\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1>(?: *\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?>(?: *\\n{2,}|\\s*$))`).replace("comment",Jr).replace(/tag/g,"(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b").getRegex(),def:/^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,heading:/^(#{1,6})(.*)(?:\n+|$)/,fences:ze,lheading:/^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,paragraph:$(Xr).replace("hr",wt).replace("heading",` *#{1,6} *[^
]`).replace("lheading",Bs).replace("|table","").replace("blockquote"," {0,3}>").replace("|fences","").replace("|list","").replace("|html","").replace("|tag","").getRegex()},Ga=/^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,Va=/^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,Ws=/^( {2,}|\\)\n(?!\s*$)[ \t]*/,Xa=/^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,ie=/[\p{P}\p{S}]/u,Xe=/[\s\p{P}\p{S}]/u,$t=/[^\s\p{P}\p{S}]/u,Ya=$(/^((?![*_])punctSpace)/,"u").replace(/punctSpace/g,Xe).getRegex(),Ja=/[\p{Pi}\p{Ps}"']/u,Qs=/(?!~)[\p{P}\p{S}]/u,eo=/(?!~)[\s\p{P}\p{S}]/u,to=/(?:[^\s\p{P}\p{S}]|~)/u,ro=$(/link|precode-code|html/,"g").replace("link",/\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/).replace("precode-",Ls?"(?<!`)()":"(^^|[^`])").replace("code",/(?<b>`+)[^`]+\k<b>(?!`)/).replace("html",/<(?! )[^<>]*?>/).getRegex(),qs=/^(?:\*+(?:((?!\*)punct)|([^\s*]))?)|^_+(?:((?!_)punct)|([^\s_]))?/,no=$(qs,"u").replace(/punct/g,ie).getRegex(),so=$(qs,"u").replace(/punct/g,Qs).getRegex(),io=$(/^(?:\*+(?:((?!\*)(?!openQuote)punct)|([^\s*]))?)|^_+(?:((?!_)(?!openQuote)punct)|([^\s_]))?/,"u").replace(/openQuote/g,Ja).replace(/punct/g,ie).getRegex(),js="^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)",ao=$(js,"gu").replace(/notPunctSpace/g,$t).replace(/punctSpace/g,Xe).replace(/punct/g,ie).getRegex(),oo=$(js,"gu").replace(/notPunctSpace/g,to).replace(/punctSpace/g,eo).replace(/punct/g,Qs).getRegex(),lo=$("^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)[\\s](\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|(?:(?!\\*)punct|notPunctSpace)(\\*+)(?!\\*)(?=notPunctSpace)","gu").replace(/notPunctSpace/g,$t).replace(/punctSpace/g,Xe).replace(/punct/g,ie).getRegex(),co=$("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)","gu").replace(/notPunctSpace/g,$t).replace(/punctSpace/g,Xe).replace(/punct/g,ie).getRegex(),uo=$("^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)[\\s](_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)|(?:(?!_)punct|notPunctSpace)(_+)(?!_)(?=notPunctSpace)","gu").replace(/notPunctSpace/g,$t).replace(/punctSpace/g,Xe).replace(/punct/g,ie).getRegex(),ho=$(/^~~?(?:((?!~)punct)|[^\s~])/,"u").replace(/punct/g,ie).getRegex(),po=$("^[^~]+(?=[^~])|(?!~)punct(~~?)(?=[\\s]|$)|notPunctSpace(~~?)(?!~)(?=punctSpace|$)|(?!~)punctSpace(~~?)(?=notPunctSpace)|[\\s](~~?)(?!~)(?=punct)|(?!~)punct(~~?)(?!~)(?=punct)|notPunctSpace(~~?)(?=notPunctSpace)","gu").replace(/notPunctSpace/g,$t).replace(/punctSpace/g,Xe).replace(/punct/g,ie).getRegex(),fo=$(/\\(punct)/,"gu").replace(/punct/g,ie).getRegex(),go=$(/(`+)(?:[^`]|[^`][\s\S]*?[^`])\1(?!`)|`+|\\(punct)/,"gu").replace(/punct/g,ie).getRegex(),_o=$(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/).replace("scheme",/[a-zA-Z][a-zA-Z0-9+.-]{1,31}/).replace("email",/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/).getRegex(),mo=$(Jr).replace("(?:-->|$)","-->").getRegex(),bo=$("^comment|^</[a-zA-Z][a-zA-Z0-9-]*\\s*>|^<[a-zA-Z][a-zA-Z0-9-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>").replace("comment",mo).replace("attribute",/\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/).getRegex(),Us=/\[(?:\\[\s\S]|[^\[\]\\])*\]/,ar=$(/(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\])|[^\[\]\\`])*?/).replace("brackets",Us).getRegex(),xo=$(/^!?\[(label)\]\([ \t\n]*(href)(?:(?:[ \t]+(?:\n[ \t]*)?|\n[ \t]*)(title))?[ \t\n]*\)/).replace("label",ar).replace("href",/<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]+|(?=\))/).replace("title",/"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|\((?:\\[\s\S]|[^)\\])*\)/).getRegex(),vo=$(/^!?\[(label)\]\[(ref)\]/).replace("label",ar).replace("ref",Yr).getRegex(),yo=$(/^!?\[(ref)\](?:\[\])?/).replace("ref",Yr).getRegex(),Hs=/(?!\s*\])(?:\\[\s\S]|[^\[\]\\]){1,999}/,ko=$(/(?:[^\[\]\\`]*(?:\[(?:brackets|\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+(?!`)[^`]*?`+(?!`)|``+(?=\]))){0,999}?[^\[\]\\`]*?/).replace("brackets",Us).getRegex(),wo=$("reflink|nolink(?!\\()","g").replace("reflink",$(/^!?\[(label)\]\[(ref)\]/).replace("label",ko).replace("ref",Hs).getRegex()).replace("nolink",$(/^!?\[(ref)\](?:\[\])?/).replace("ref",Hs).getRegex()).getRegex(),Ks=/[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,So=$(/(?:mailto:email|xmpp:email(?:\/[A-Za-z0-9@.]+)?)/).replace(/email/g,/[A-Za-z0-9._+-]+@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),tn={_backpedal:ze,anyPunctuation:fo,anyPunctuationOutsideCode:go,autolink:_o,blockSkip:ro,br:Ws,code:Va,del:ze,delLDelim:ze,delRDelim:ze,emStrongLDelim:no,emStrongRDelimAst:ao,emStrongRDelimUnd:co,escape:Ga,link:xo,nolink:yo,punctuation:Ya,reflink:vo,reflinkSearch:wo,tag:bo,text:Xa,url:ze},$o={...tn,emStrongLDelim:io,emStrongRDelimAst:lo,emStrongRDelimUnd:uo,link:$(/^!?\[(label)\]\((.*?)\)/).replace("label",ar).getRegex(),reflink:$(/^!?\[(label)\]\s*\[([^\]]*)\]/).replace("label",ar).getRegex()},rn={...tn,emStrongRDelimAst:oo,emStrongLDelim:so,delLDelim:ho,delRDelim:po,url:$(/^emailProtocol|^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/).replace("emailProtocol",So).replace("protocol",Ks).replace("email",/[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![\w-])/).getRegex(),_backpedal:/(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,del:/^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,text:$(/^(?:[^a-zA-Z0-9](?=emailProtocol)|(`+|~+|[^`~])(?:(?=[`~])|(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|wwwStart|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9](?=emailProtocol)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@))))/).replace("protocol",Ks).replace(/emailProtocol/g,/(?:mailto|xmpp):/).replace("wwwStart",Ls?"(?<![^\\s*_~(])www\\.":"www\\.").getRegex()},Po={...rn,br:$(Ws).replace("{2,}","*").getRegex(),text:$(rn.text).replace("\\b_","\\b_| {2,}\\n").replace(/\{2,\}/g,"*").getRegex()},or={normal:en,gfm:Ka,pedantic:Za},Pt={normal:tn,gfm:rn,breaks:Po,pedantic:$o},Ro={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"},Zs=e=>Ro[e];function J(e,t){if(t){if(H.escapeTest.test(e))return e.replace(H.escapeReplace,Zs)}else if(H.escapeTestNoEncode.test(e))return e.replace(H.escapeReplaceNoEncode,Zs);return e}function Co(e){return H.numericCharacterReference.test(e)?e.replace(H.numericCharacterReferenceOrAmpersand,(t,r,n)=>{if(r===void 0&&n===void 0)return"&amp;";let s=r===void 0?Number.parseInt(n,16):Number.parseInt(r,10);return s===0||s>1114111||s>=55296&&s<=57343?"�":s===38?"&amp;":String.fromCodePoint(s)}):e}function Gs(e){try{e=encodeURI(e).replace(H.percentDecode,"%")}catch{return null}return e}function Vs(e,t){let r=e.replace(H.findPipe,(s,i,a)=>{let o=!1,l=i;for(;--l>=0&&a[l]==="\\";)o=!o;return o?"|":" |"}).split(H.splitPipe),n=0;if(r[0].trim()||r.shift(),r.length>0&&!r.at(-1)?.trim()&&r.pop(),t)if(r.length>t)r.splice(t);else for(;r.length<t;)r.push("");for(;n<r.length;n++)r[n]=r[n].trim().replace(H.slashPipe,"|");return r}function de(e,t,r){let n=e.length;if(n===0)return"";let s=0;for(;s<n;){let i=e.charAt(n-s-1);if(i===t&&!r)s++;else if(i!==t&&r)s++;else break}return e.slice(0,n-s)}function Xs(e){let t=e.split(`
`),r=t.length-1;for(;r>=0&&H.blankLine.test(t[r]);)r--;return t.length-r<=2?e:t.slice(0,r+1).join(`
`)}function lr(e){return e.trim().replace(H.multipleSpaceGlobal," ").toLowerCase().toUpperCase().toLowerCase()}function Ys(e,t){if(e.indexOf(t[0])===-1&&e.indexOf(t[1])===-1)return-1;let r=0;for(let n=0;n<e.length;n++)if(e[n]==="\\")n++;else if(e[n]===t[0])r++;else if(e[n]===t[1]&&(r--,r<0))return n;return r>0?-2:-1}var Ye=new WeakMap;function nn(e){let t={"*":-1,_:-1},r=-1,n=e.length;for(let s=0;s<n;s++){let i=e[s];if(i!=="*"&&i!=="_"&&i!=="~")continue;let a=s===0?`
`:e[s-1],o=s+1;for(;o<n&&e[o]===i;)o++;a!==" "&&a!=="	"&&a!==`
`&&a!=="\r"&&a!=="\f"&&(i==="~"?r=s:t[i]=s),s=o-1}return{maskedSrc:e,lastPossibleEmStrongCloserIndex:t,lastPossibleDelCloserIndex:r}}function Mo(e,t){let r=nn(t),n=Ye.get(e);n?n.push(r):Ye.set(e,[r])}function To(e){let t=Ye.get(e);t&&(t.pop(),t.length===0&&Ye.delete(e))}function Ao(e,t,r){let n=Ye.get(e)?.at(-1);return n&&n.maskedSrc===t?n.lastPossibleEmStrongCloserIndex[r]:nn(t).lastPossibleEmStrongCloserIndex[r]}function Io(e,t){let r=Ye.get(e)?.at(-1);return r&&r.maskedSrc===t?r.lastPossibleDelCloserIndex:nn(t).lastPossibleDelCloserIndex}function cr(e,t=0){let r=t,n="";for(let s of e)if(s==="	"){let i=4-r%4;n+=" ".repeat(i),r+=i}else n+=s,r++;return n}function Js(e,t,r,n,s){let i=t.href,a=t.title||null,o=e[1].replace(s.other.outputLinkReplace,"$1"),l=e[0].charAt(0)==="!",u=n.state.inLink,d=n.state.linkEmitted,p=n.state.inRawBlock;n.state.inLink=!0,n.state.linkEmitted=!1;let h=n.inlineTokens(o),f=n.state.linkEmitted;if(n.state.linkEmitted=d,n.state.inLink=u,!l){if(f){n.state.inRawBlock=p;return}n.state.linkEmitted=!0}return{type:l?"image":"link",raw:r,href:i,title:a,text:o,tokens:h}}function Oo(e,t,r){let n=e.match(r.other.indentCodeCompensation);if(n===null)return t;let s=n[1];return t.split(`
`).map(i=>{let a=i.match(r.other.beginningSpace);if(a===null)return i;let[o]=a;return i.slice(Math.min(o.length,s.length))}).join(`
`)}function ei(e,t,r,n){if(!t.includes("<"))return!1;for(let s=0;s<t.length;s++){if(t[s]==="\\"){s++;continue}if(t[s]==="`"){let o=n.inline.code.exec(t.slice(s));if(o){s+=o[0].length-1;continue}}if(t[s]!=="<")continue;let i=e.slice(r+s),a=n.inline.tag.exec(i)||n.inline.autolink.exec(i);if(a){if(a[0].length>t.length-s)return!0;s+=a[0].length-1}}return!1}var Je=class{constructor(e){O(this,"options",void 0),O(this,"rules",void 0),O(this,"lexer",void 0),this.options=e||Le}space(e){let t=this.rules.block.newline.exec(e);if(t&&t[0].length>0)return{type:"space",raw:t[0]}}code(e){let t=this.rules.block.code.exec(e);if(t){let r=this.options.pedantic?t[0]:Xs(t[0]);return{type:"code",raw:r,codeBlockStyle:"indented",text:r.replace(this.rules.other.codeRemoveIndent,"")}}}fences(e){let t=this.rules.block.fences.exec(e);if(t){let r=t[0],n=Oo(r,t[3]||"",this.rules);return{type:"code",raw:r,lang:t[2]?t[2].trim().replace(this.rules.inline.anyPunctuation,"$1"):t[2],text:n}}}heading(e){let t=this.rules.block.heading.exec(e);if(t){let r=t[2].trim();if(this.rules.other.endingHash.test(r)){let n=de(r,"#");(this.options.pedantic||!n||this.rules.other.endingSpaceTabChar.test(n))&&(r=n.trim())}return{type:"heading",raw:de(t[0],`
`),depth:t[1].length,text:r,tokens:this.lexer.inline(r)}}}hr(e){let t=this.rules.block.hr.exec(e);if(t)return{type:"hr",raw:de(t[0],`
`)}}blockquote(e){let t=this.rules.block.blockquote.exec(e);if(t){let r=de(t[0],`
`).split(`
`),n="",s="",i=[];for(;r.length>0;){let a=!1,o=[],l=0;for(;l<r.length;l++)if(this.rules.other.blockquoteStart.test(r[l]))o.push(r[l]),a=!0;else if(!a)o.push(r[l]);else break;r=r.slice(l);let u=o.join(`
`),d=u.replace(this.rules.other.blockquoteMarkerWhitespace,(f,_,v)=>_+cr(v,_.length)).replace(this.rules.other.blockquoteSetextReplace,`
    $1`).replace(this.rules.other.blockquoteSetextReplace2,"");n=n?`${n}
${u}`:u,s=s?`${s}
${d}`:d;let p=this.lexer.state.top;if(this.lexer.state.top=!0,this.lexer.blockTokens(d,i,!0),this.lexer.state.top=p,r.length===0)break;let h=i.at(-1);if(h?.type==="code"||h?.type==="heading"||h?.type==="hr"||h?.type==="html"||h?.type==="table")break;if(h?.type==="blockquote"){let f=h,_=r.join(`
`),v=f.raw+`
`+_.replace(this.rules.other.blockquoteSetextReplace2,""),m=this.blockquote(v);i[i.length-1]=m;let k=v.substring(m.raw.length).replace(/^\n/,""),x=k?k.split(`
`).length:0,R=x?r.slice(0,-x):r;if(R.length>0&&(n=`${n}
${R.join(`
`)}`),s=s.substring(0,s.length-f.text.length)+m.text,r=r.slice(R.length),r.length>0&&this.rules.other.blockquoteStart.test(r[0]))continue;break}else if(h?.type==="list"){let f=h,_=f.raw+`
`+r.join(`
`),v=this.list(_);i[i.length-1]=v;let m=v.raw.length>f.raw.length?_.slice(f.raw.length+1,v.raw.length).split(`
`).length:0;if(m>0){let k=r.slice(0,m).join(`
`);n=`${n}
${k}`,s=`${s}
${k}`}r=r.slice(m);continue}}return{type:"blockquote",raw:n,tokens:i,text:s}}}list(e){let t=this.rules.block.list.exec(e);if(t){let r=e,n=()=>r.length-e.length,s=t[1].trim(),i=s.length>1,a={type:"list",raw:"",ordered:i,start:i?+s.slice(0,-1):"",loose:!1,items:[]};s=i?`\\d{1,9}\\${s.slice(-1)}`:`\\${s}`,this.options.pedantic&&(s=i?s:"[*+-]");let o=this.rules.other.listItemRegex(s),l=!1;for(;e;){let d=!1,p="";if(!(t=o.exec(e))||this.rules.block.hr.test(e))break;let h=n();e=e.substring(t[0].length);let f=t[2].split(`
`,1)[0],_=t[1].length,v=this.options.pedantic?cr(f,_):f.replace(this.rules.other.leadingSpaceTab,I=>cr(I,_)),m=e.split(`
`,1)[0],k=!v.trim(),x=0;if(this.options.pedantic?(x=2,p=v.trimStart()):k?x=_+1:(x=v.search(this.rules.other.nonSpaceChar),x=x>4?1:x,p=v.slice(x),x+=_),k&&this.rules.other.blankLine.test(m)&&(e=e.substring(m.length+1),d=!0),!d){let I=this.rules.other.nextBulletRegex(x),M=this.rules.other.hrRegex(x),Q=this.rules.other.fencesBeginRegex(x),y=this.options.pedantic?this.rules.other.pedanticHeadingBeginRegex(x):this.rules.other.headingBeginRegex(x),E=this.rules.other.htmlBeginRegex(x),L=this.rules.other.blockquoteBeginRegex(x);for(;e;){let C=e.split(`
`,1)[0],q;if(m=C,this.options.pedantic?(m=m.replace(this.rules.other.listReplaceNesting,"  "),q=m):q=m.replace(this.rules.other.leadingSpaceTab,F=>cr(F)),Q.test(m)||y.test(m)||E.test(m)||L.test(m)||I.test(m)||M.test(m))break;if(q.search(this.rules.other.nonSpaceChar)>=x||!m.trim())p+=`
`+q.slice(x);else{if(k||v.replace(this.rules.other.tabCharGlobal,"    ").search(this.rules.other.nonSpaceChar)>=4||Q.test(v)||y.test(v)||E.test(v)||M.test(v))break;let F=!this.options.pedantic&&/^ {0,3}(?:=+|-+) *$/.test(m)&&this.rules.block.lheading.test(`${v}
${m}`)?`    ${q.replace(/^ {0,3}/,"")}`:m;p+=`
`+F}k=!m.trim(),e=e.substring(C.length+1),v=q.slice(x)}}let R=r.slice(h,n());a.loose||(l?a.loose=!0:this.rules.other.doubleBlankLine.test(R)&&(l=!0)),a.items.push({type:"list_item",raw:R,task:!!this.options.gfm&&this.rules.other.listIsTask.test(p),loose:!1,text:p,tokens:[]})}let u=a.items.at(-1);if(u)u.raw=u.raw.trimEnd(),u.text=u.text.trimEnd();else return;a.raw=r.slice(0,n()).trimEnd();for(let d of a.items)if(this.lexer.state.top=!1,d.tokens=this.lexer.blockTokens(d.text,[]),!a.loose){let p=d.tokens.filter(h=>h.type==="space");a.loose=p.length>0&&p.some(h=>this.rules.other.anyLine.test(h.raw))}for(let d of a.items){let p=d.tokens[0];if(d.task&&(p?.type==="text"||p?.type==="paragraph")){d.text=d.text.replace(this.rules.other.listReplaceTask,""),p.raw=p.raw.replace(this.rules.other.listReplaceTask,""),p.text=p.text.replace(this.rules.other.listReplaceTask,"");for(let f=this.lexer.inlineQueue.length-1;f>=0;f--)if(this.rules.other.listIsTask.test(this.lexer.inlineQueue[f].src)){this.lexer.inlineQueue[f].src=this.lexer.inlineQueue[f].src.replace(this.rules.other.listReplaceTask,"");break}let h=this.rules.other.listTaskCheckbox.exec(d.raw);if(h){let f={type:"checkbox",raw:h[0]+" ",checked:h[0]!=="[ ]"};d.checked=f.checked,a.loose?d.tokens[0]&&["paragraph","text"].includes(d.tokens[0].type)&&"tokens"in d.tokens[0]&&d.tokens[0].tokens?(d.tokens[0].raw=f.raw+d.tokens[0].raw,d.tokens[0].text=f.raw+d.tokens[0].text,d.tokens[0].tokens.unshift(f)):d.tokens.unshift({type:"paragraph",raw:f.raw,text:f.raw,tokens:[f]}):d.tokens.unshift(f)}}else d.task&&(d.task=!1)}if(a.loose)for(let d of a.items){d.loose=!0;for(let p of d.tokens)p.type==="text"&&(p.type="paragraph")}return a}}html(e){let t=this.rules.block.html.exec(e);if(t){let r=Xs(t[0]);return{type:"html",block:!0,raw:r,pre:t[1]==="pre"||t[1]==="script"||t[1]==="style",text:r}}}def(e){let t=this.rules.block.def.exec(e);if(t){if(!this.rules.other.startAngleBracket.test(t[2])&&Ys(t[2],"()")!==-1)return;let r=lr(t[1]),n=t[2]?t[2].replace(this.rules.other.hrefBrackets,"$1").replace(this.rules.inline.anyPunctuation,"$1"):"",s=t[3]?t[3].substring(1,t[3].length-1).replace(this.rules.inline.anyPunctuation,"$1"):t[3];return{type:"def",tag:r,raw:de(t[0],`
`),href:n,title:s}}}table(e){let t=this.rules.block.table.exec(e);if(!t||!this.rules.other.tableDelimiter.test(t[2]))return;let r=Vs(t[1]),n=t[2].replace(this.rules.other.tableAlignChars,"").split("|"),s=t[3]?.trim()?t[3].replace(this.rules.other.tableRowBlankLine,"").split(`
`):[],i={type:"table",raw:de(t[0],`
`),header:[],align:[],rows:[]};if(r.length===n.length){for(let a of n)this.rules.other.tableAlignRight.test(a)?i.align.push("right"):this.rules.other.tableAlignCenter.test(a)?i.align.push("center"):this.rules.other.tableAlignLeft.test(a)?i.align.push("left"):i.align.push(null);for(let a=0;a<r.length;a++)i.header.push({text:r[a],tokens:this.lexer.inline(r[a]),header:!0,align:i.align[a]});for(let a of s)i.rows.push(Vs(a,i.header.length).map((o,l)=>({text:o,tokens:this.lexer.inline(o),header:!1,align:i.align[l]})));return i}}lheading(e){let t=this.rules.block.lheading.exec(e);if(t){let r=t[1].trim();return{type:"heading",raw:de(t[0],`
`),depth:t[2].charAt(0)==="="?1:2,text:r,tokens:this.lexer.inline(r)}}}paragraph(e){let t=this.rules.block.paragraph.exec(e);if(t){let r=t[1].charAt(t[1].length-1)===`
`?t[1].slice(0,-1):t[1];return{type:"paragraph",raw:t[0],text:r,tokens:this.lexer.inline(r)}}}text(e){let t=this.rules.block.text.exec(e);if(t)return{type:"text",raw:t[0],text:t[0],tokens:this.lexer.inline(t[0])}}escape(e){let t=this.rules.inline.escape.exec(e);if(t)return{type:"escape",raw:t[0],text:t[1]}}tag(e){let t=this.rules.inline.tag.exec(e);if(t)return!this.lexer.state.inLink&&this.rules.other.startATag.test(t[0])?this.lexer.state.inLink=!0:this.lexer.state.inLink&&this.rules.other.endATag.test(t[0])&&(this.lexer.state.inLink=!1),!this.lexer.state.inRawBlock&&this.rules.other.startPreScriptTag.test(t[0])?this.lexer.state.inRawBlock=!0:this.lexer.state.inRawBlock&&this.rules.other.endPreScriptTag.test(t[0])&&(this.lexer.state.inRawBlock=!1),{type:"html",raw:t[0],inLink:this.lexer.state.inLink,inRawBlock:this.lexer.state.inRawBlock,block:!1,text:t[0]}}link(e){if(this.lexer.state.linkParenPossible===!1)return;let t=this.rules.inline.link.exec(e);if(t){let r=t[0].charAt(0)==="!"?2:1;if(!this.options.pedantic&&ei(e,t[1],r,this.rules))return;let n=t[2].trim();if(!this.options.pedantic&&this.rules.other.startAngleBracket.test(n)){if(!this.rules.other.endAngleBracket.test(n))return;let o=de(n.slice(0,-1),"\\");if((n.length-o.length)%2===0)return}else{let o=Ys(t[2],"()");if(o===-2)return;if(o>-1){let l=(t[0].indexOf("!")===0?5:4)+t[1].length+o;t[2]=t[2].substring(0,o),t[0]=t[0].substring(0,l).trim(),t[3]=""}}let s=de(t[0].slice(0,-1),"\\");if((t[0].length-s.length)%2===0)return;let i=t[2],a="";if(this.options.pedantic){let o=this.rules.other.pedanticHrefTitle.exec(i);o&&(i=o[1],a=o[3])}else a=t[3]?t[3].slice(1,-1):"";return i=i.trim(),this.rules.other.startAngleBracket.test(i)&&(this.options.pedantic&&!this.rules.other.endAngleBracket.test(n)?i=i.slice(1):i=i.slice(1,-1)),Js(t,{href:i&&i.replace(this.rules.inline.anyPunctuation,"$1"),title:a&&a.replace(this.rules.inline.anyPunctuation,"$1")},t[0],this.lexer,this.rules)}}reflink(e,t){let r;if((r=this.rules.inline.reflink.exec(e))||(r=this.rules.inline.nolink.exec(e))){let n=r[0].charAt(0)==="!"?2:1;if(!this.options.pedantic&&ei(e,r[1],n,this.rules))return;let s=t[lr(r[2]||r[1])];if(!s){let i=r[0].charAt(0);return{type:"text",raw:i,text:i}}return Js(r,s,r[0],this.lexer,this.rules)}}emStrong(e,t,r=""){let n=this.rules.inline.emStrongLDelim.exec(e);if(!n||!n[1]&&!n[2]&&!n[3]&&!n[4])return;let s=n[0][0],i=r===s,a=t.length-e.length,o=a;for(;!this.options.pedantic&&o>0&&t[o-1]===s;)o--;let l=[...t.slice(Math.max(0,o-2),o)].at(-1)??"",u=l==="*"||l==="_"||!!this.rules.inline.punctuation.exec(l);o<a&&(r=l);let d=o<a?u:!!this.rules.inline.punctuation.exec(r);if(n[4]&&r.match(this.rules.other.unicodeAlphaNumeric))return;let p=n[1]||n[3]||"";if(!p||!r||d){let h=[...n[0]].length-1,f,_,v=h,m=0,k=a-o+h,x=!this.options.pedantic&&!!l.trim()&&(!!p||s==="*"&&!u);if(s!=="*"&&s!=="_")return;let R=s==="*"?this.rules.inline.emStrongRDelimAst:this.rules.inline.emStrongRDelimUnd,I=Ao(this,t,s),M=t.length-e.length+h;if(I<M)return;t=t.slice(-1*e.length+h);let Q=I-M;for(R.lastIndex=0;(n=R.exec(t))!==null&&!(n.index>Q);){if(f=n[1]||n[2]||n[3]||n[4]||n[5]||n[6],!f)continue;if(_=[...f].length,n[3]||n[4]){v+=_;continue}else if(n[5]||n[6]||x){if(i&&(n[5]||n[6]))break;if(k%3&&!((k+_)%3)){m+=_;continue}}if(v-=_,v>0)continue;_=Math.min(_,_+v+m);let y=[...n[0]][0].length,E=e.slice(0,h+n.index+y+_);if(Math.min(h,_)%2){let C=E.slice(1,-1);return{type:"em",raw:E,text:C,tokens:this.lexer.inlineTokens(C)}}let L=E.slice(2,-2);return{type:"strong",raw:E,text:L,tokens:this.lexer.inlineTokens(L)}}}}codespan(e){let t=this.rules.inline.code.exec(e);if(t){let r=t[2].replace(this.rules.other.newLineCharGlobal," "),n=this.rules.other.nonSpaceChar.test(r),s=this.rules.other.startingSpaceChar.test(r)&&this.rules.other.endingSpaceChar.test(r);return n&&s&&(r=r.substring(1,r.length-1)),{type:"codespan",raw:t[0],text:r}}}br(e){let t=this.rules.inline.br.exec(e);if(t)return{type:"br",raw:t[0]}}del(e,t,r=""){let n=this.rules.inline.delLDelim.exec(e);if(n&&(!n[1]||!r||this.rules.inline.punctuation.exec(r))){let s=[...n[0]].length-1,i,a,o=s,l=this.rules.inline.delRDelim,u=Io(this,t),d=t.length-e.length+s;if(u<d)return;t=t.slice(-1*e.length+s);let p=u-d;for(l.lastIndex=0;(n=l.exec(t))!==null&&!(n.index>p);){if(i=n[1]||n[2]||n[3]||n[4]||n[5]||n[6],!i||(a=[...i].length,a!==s))continue;if(n[3]||n[4]){o+=a;continue}if(o-=a,o>0)continue;a=Math.min(a,a+o);let h=[...n[0]][0].length,f=e.slice(0,s+n.index+h+a),_=f.slice(s,-s);return{type:"del",raw:f,text:_,tokens:this.lexer.inlineTokens(_)}}}}autolink(e){let t=this.rules.inline.autolink.exec(e);if(t){let r,n;return t[2]==="@"?(r=t[1],n="mailto:"+r):(r=t[1],n=r),{type:"link",raw:t[0],text:r,href:n,autolink:!0,tokens:[{type:"text",raw:r,text:r}]}}}url(e){let t;if(t=this.rules.inline.url.exec(e)){let r,n;if(t[2]==="@")r=t[0],n="mailto:"+r;else{let s;do s=t[0],t[0]=this.rules.inline._backpedal.exec(t[0])?.[0]??"";while(s!==t[0]);r=t[0],t[1]==="www."?n="http://"+t[0]:n=t[0]}return{type:"link",raw:t[0],text:r,href:n,autolink:!0,tokens:[{type:"text",raw:r,text:r}]}}}inlineText(e){let t=this.rules.inline.text.exec(e);if(t){let r=this.lexer.state.inRawBlock;return{type:"text",raw:t[0],text:r?t[0]:Co(t[0]),escaped:r}}}},re=(kt=new WeakSet,class dn{constructor(t){pt(this,kt),O(this,"tokens",void 0),O(this,"options",void 0),O(this,"state",void 0),O(this,"inlineQueue",void 0),O(this,"tokenizer",void 0),this.tokens=[],this.tokens.links=Object.create(null),this.options=t||Le,this.options.tokenizer=this.options.tokenizer||new Je,this.tokenizer=this.options.tokenizer,this.tokenizer.options=this.options,this.tokenizer.lexer=this,this.inlineQueue=[],this.state={inLink:!1,inRawBlock:!1,linkEmitted:!1,linkParenPossible:!0,top:!0};let r={other:H,block:or.normal,inline:Pt.normal};this.options.pedantic?(r.block=or.pedantic,r.inline=Pt.pedantic):this.options.gfm&&(r.block=or.gfm,this.options.breaks?r.inline=Pt.breaks:r.inline=Pt.gfm),this.tokenizer.rules=r}static get rules(){return{block:or,inline:Pt}}static lex(t,r){return new dn(r).lex(t)}static lexInline(t,r){return new dn(r).inlineTokens(t)}lex(t){t=t.replace(H.carriageReturn,`
`),this.blockTokens(t,this.tokens);for(let r=0;r<this.inlineQueue.length;r++){let n=this.inlineQueue[r];this.state.inRawBlock=!1,this.inlineTokens(n.src,n.tokens)}return this.inlineQueue=[],this.tokens}blockTokens(t,r=[],n=!1){this.tokenizer.lexer=this,this.options.pedantic&&(t=t.replace(H.tabCharGlobal,"    ").replace(H.spaceLine,""));let s=1/0;for(;t;){if(t.length<s)s=t.length;else{this.infiniteLoopError(t.charCodeAt(0));break}let i;if(this.options.extensions?.block?.some(o=>(i=o.call({lexer:this},t,r))?(t=t.substring(i.raw.length),r.push(i),!0):!1))continue;if(i=this.tokenizer.space(t)){t=t.substring(i.raw.length);let o=r.at(-1);i.raw.length===1&&o!==void 0?o.raw+=`
`:r.push(i);continue}if(i=this.tokenizer.code(t)){t=t.substring(i.raw.length);let o=r.at(-1);o?.type==="paragraph"||o?.type==="text"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+i.raw,o.text+=`
`+i.text,this.inlineQueue.at(-1).src=o.text):r.push(i);continue}if(i=this.tokenizer.fences(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.heading(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.hr(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.blockquote(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.list(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.html(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.def(t)){t=t.substring(i.raw.length);let o=r.at(-1);o?.type==="paragraph"||o?.type==="text"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+i.raw,o.text+=`
`+i.raw,this.inlineQueue.at(-1).src=o.text):(this.tokens.links[i.tag]||(this.tokens.links[i.tag]={href:i.href,title:i.title}),r.push(i));continue}if(i=this.tokenizer.table(t)){t=t.substring(i.raw.length),r.push(i);continue}if(i=this.tokenizer.lheading(t)){t=t.substring(i.raw.length),r.push(i);continue}let a=t;if(this.options.extensions?.startBlock){let o=1/0,l=t.slice(1),u;this.options.extensions.startBlock.forEach(d=>{u=d.call({lexer:this},l),typeof u=="number"&&u>=0&&(o=Math.min(o,u))}),o<1/0&&o>=0&&(a=t.substring(0,o+1))}if(this.state.top&&(i=this.tokenizer.paragraph(a))){let o=r.at(-1);n&&o?.type==="paragraph"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+i.raw,o.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=o.text):r.push(i),n=a.length!==t.length,t=t.substring(i.raw.length);continue}if(i=this.tokenizer.text(t)){t=t.substring(i.raw.length);let o=r.at(-1);o?.type==="text"?(o.raw+=(o.raw.endsWith(`
`)?"":`
`)+i.raw,o.text+=`
`+i.text,this.inlineQueue.pop(),this.inlineQueue.at(-1).src=o.text):r.push(i);continue}if(t){this.infiniteLoopError(t.charCodeAt(0));break}}return this.state.top=!0,r}inline(t,r=[]){return this.inlineQueue.push({src:t,tokens:r}),r}linkInText(t){if(!t.includes("["))return!1;let r=this.tokenizer.rules.inline.link;for(let n of t.matchAll(this.tokenizer.rules.inline.blockSkip))if(r.test(n[0])&&t.charAt(n.index-1)!=="!")return!0;for(let n of t.matchAll(this.tokenizer.rules.inline.reflinkSearch)){let s=n[0],i=s.lastIndexOf("[");if(!(s.charAt(0)==="!"||!Object.hasOwn(this.tokens.links,lr(s.slice(i+1,-1))))&&!(i>1&&this.linkInText(s.slice(1,i-1))))return!0}return!1}inlineTokens(t,r=[]){this.tokenizer.lexer=this;let n=this.state.linkParenPossible;this.state.linkParenPossible=n&&t.includes(")");try{return S(kt,this,Eo).call(this,t,r)}finally{this.state.linkParenPossible=n}}infiniteLoopError(t){let r="Infinite loop on byte: "+t;if(this.options.silent)console.error(r);else throw new Error(r)}});function Eo(e,t){let r=e.includes("*")||e.includes("_")||e.includes("~")||this.options.hooks?.emStrongMask||this.tokenizer.emStrong!==Je.prototype.emStrong||this.tokenizer.del!==Je.prototype.del?S(kt,this,Lo).call(this,e):e;Mo(this.tokenizer,r);try{return S(kt,this,Fo).call(this,e,r,t)}finally{To(this.tokenizer)}}function Fo(e,t,r){let n=!1,s="",i=1/0;for(;e;){if(e.length<i)i=e.length;else{this.infiniteLoopError(e.charCodeAt(0));break}n||(s=""),n=!1;let a;if(this.options.extensions?.inline?.some(l=>(a=l.call({lexer:this},e,r))?(e=e.substring(a.raw.length),r.push(a),!0):!1))continue;if(a=this.tokenizer.escape(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.tag(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.link(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.reflink(e,this.tokens.links)){e=e.substring(a.raw.length);let l=r.at(-1);a.type==="text"&&l?.type==="text"?(l.raw+=a.raw,l.text+=a.text):r.push(a);continue}if(a=this.tokenizer.emStrong(e,t,s)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.codespan(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.br(e)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.del(e,t,s)){e=e.substring(a.raw.length),r.push(a);continue}if(a=this.tokenizer.autolink(e)){e=e.substring(a.raw.length),r.push(a);continue}if(!this.state.inLink&&(a=this.tokenizer.url(e))){e=e.substring(a.raw.length),r.push(a);continue}let o=e;if(this.options.extensions?.startInline){let l=1/0,u=e.slice(1),d;this.options.extensions.startInline.forEach(p=>{d=p.call({lexer:this},u),typeof d=="number"&&d>=0&&(l=Math.min(l,d))}),l<1/0&&l>=0&&(o=e.substring(0,l+1))}if(a=this.tokenizer.inlineText(o)){e=e.substring(a.raw.length),a.raw.slice(-1)!=="_"&&(s=a.raw.slice(-1)),n=!0;let l=r.at(-1);l?.type==="text"?(l.raw+=a.raw,l.text+=a.text):r.push(a);continue}if(e){this.infiniteLoopError(e.charCodeAt(0));break}}return r}function Lo(e){let t=e;if(this.tokens.links&&e.includes("[")){let r=this.tokenizer.rules.inline.reflinkSearch,n=s=>{let i=s.lastIndexOf("[");if(!Object.hasOwn(this.tokens.links,lr(s.slice(i+1,-1))))return s;if(i>1&&s.charAt(0)!=="!"){let a=s.slice(1,i-1);if(this.linkInText(a))return"["+a.replace(r,n)+"]["+"a".repeat(s.length-i-2)+"]"}return"["+"a".repeat(s.length-2)+"]"};t=t.replace(r,n)}return t=t.replace(this.tokenizer.rules.inline.anyPunctuationOutsideCode,(r,n,s)=>s?"+".repeat(r.length):n?n+r.slice(n.length,-n.length).replace(/`/g,"+")+n:r),t=t.replace(this.tokenizer.rules.inline.blockSkip,(r,n,s)=>{let i=s?s.length:0;return r.slice(0,i)+"["+"a".repeat(r.length-i-2)+"]"}),t=this.options.hooks?.emStrongMask?.call({lexer:this},t)??t,t}var ur=class{constructor(e){O(this,"options",void 0),O(this,"parser",void 0),this.options=e||Le}space(e){return""}code({text:e,lang:t,escaped:r}){let n=(t||"").match(H.notSpaceStart)?.[0],s=e?e.replace(H.endingNewline,"")+`
`:"";return n?'<pre><code class="language-'+J(n)+'">'+(r?s:J(s,!0))+`</code></pre>
`:"<pre><code>"+(r?s:J(s,!0))+`</code></pre>
`}blockquote({tokens:e}){return`<blockquote>
${this.parser.parse(e)}</blockquote>
`}html({text:e}){return e}def(e){return""}heading({tokens:e,depth:t}){return`<h${t}>${this.parser.parseInline(e)}</h${t}>
`}hr(e){return`<hr>
`}list(e){let t=e.ordered,r=e.start,n="";for(let a=0;a<e.items.length;a++){let o=e.items[a];n+=this.listitem(o)}let s=t?"ol":"ul",i=t&&r!==1?' start="'+r+'"':"";return"<"+s+i+`>
`+n+"</"+s+`>
`}listitem(e){return`<li>${this.parser.parse(e.tokens)}</li>
`}checkbox({checked:e}){return"<input "+(e?'checked="" ':"")+'disabled="" type="checkbox"> '}paragraph({tokens:e}){return`<p>${this.parser.parseInline(e)}</p>
`}table(e){let t="",r="";for(let s=0;s<e.header.length;s++)r+=this.tablecell(e.header[s]);t+=this.tablerow({text:r});let n="";for(let s=0;s<e.rows.length;s++){let i=e.rows[s];r="";for(let a=0;a<i.length;a++)r+=this.tablecell(i[a]);n+=this.tablerow({text:r})}return n&&(n=`<tbody>${n}</tbody>`),`<table>
<thead>
`+t+`</thead>
`+n+`</table>
`}tablerow({text:e}){return`<tr>
${e}</tr>
`}tablecell(e){let t=this.parser.parseInline(e.tokens),r=e.header?"th":"td";return(e.align?`<${r} align="${e.align}">`:`<${r}>`)+t+`</${r}>
`}strong({tokens:e}){return`<strong>${this.parser.parseInline(e)}</strong>`}em({tokens:e}){return`<em>${this.parser.parseInline(e)}</em>`}codespan({text:e}){return`<code>${J(e,!0)}</code>`}br(e){return"<br>"}del({tokens:e}){return`<del>${this.parser.parseInline(e)}</del>`}link({href:e,title:t,text:r,tokens:n,autolink:s}){let i=s?J(r,!0):this.parser.parseInline(n),a=Gs(e);if(a===null)return i;e=J(a,s);let o='<a href="'+e+'"';return t&&(o+=' title="'+J(t)+'"'),o+=">"+i+"</a>",o}image({href:e,title:t,text:r,tokens:n}){n&&(r=this.parser.parseInline(n,this.parser.textRenderer));let s=Gs(e);if(s===null)return J(r);e=s;let i=`<img src="${J(e)}" alt="${J(r)}"`;return t&&(i+=` title="${J(t)}"`),i+=">",i}text(e){return"tokens"in e&&e.tokens?this.parser.parseInline(e.tokens):"escaped"in e&&e.escaped?e.text:J(e.text)}},sn=class{constructor(){O(this,"parser",void 0)}strong({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}em({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}codespan({text:e}){return e}del({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}html({text:e}){return e}text({text:e}){return e}link({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}image({text:e,tokens:t}){return t?this.parser.parseInline(t,this):e}br(){return""}checkbox({raw:e}){return e}},ne=class pn{constructor(t){O(this,"options",void 0),O(this,"renderer",void 0),O(this,"textRenderer",void 0),this.options=t||Le,this.options.renderer=this.options.renderer||new ur,this.renderer=this.options.renderer,this.renderer.options=this.options,this.renderer.parser=this,this.textRenderer=new sn,this.textRenderer.parser=this}static parse(t,r){return new pn(r).parse(t)}static parseInline(t,r){return new pn(r).parseInline(t)}parse(t){this.renderer.parser=this;let r="";for(let n=0;n<t.length;n++){let s=t[n];if(this.options.extensions?.renderers?.[s.type]){let a=s,o=this.options.extensions.renderers[a.type].call({parser:this},a);if(o!==!1||!["space","hr","heading","code","table","blockquote","list","checkbox","html","def","paragraph","text"].includes(a.type)){r+=o||"";continue}}let i=s;switch(i.type){case"space":r+=this.renderer.space(i);break;case"hr":r+=this.renderer.hr(i);break;case"heading":r+=this.renderer.heading(i);break;case"code":r+=this.renderer.code(i);break;case"table":r+=this.renderer.table(i);break;case"blockquote":r+=this.renderer.blockquote(i);break;case"list":r+=this.renderer.list(i);break;case"checkbox":r+=this.renderer.checkbox(i);break;case"html":r+=this.renderer.html(i);break;case"def":r+=this.renderer.def(i);break;case"paragraph":r+=this.renderer.paragraph(i);break;case"text":r+=this.renderer.text(i);break;default:{let a='Token with "'+i.type+'" type was not found.';if(this.options.silent)return console.error(a),"";throw new Error(a)}}}return r}parseInline(t,r=this.renderer){this.renderer.parser=this;let n="";for(let s=0;s<t.length;s++){let i=t[s];if(this.options.extensions?.renderers?.[i.type]){let o=this.options.extensions.renderers[i.type].call({parser:this},i);if(o!==!1||!["escape","html","link","image","checkbox","strong","em","codespan","br","del","text"].includes(i.type)){n+=o||"";continue}}let a=i;switch(a.type){case"escape":n+=r.text(a);break;case"html":n+=r.html(a);break;case"link":n+=r.link(a);break;case"image":n+=r.image(a);break;case"checkbox":n+=r.checkbox(a);break;case"strong":n+=r.strong(a);break;case"em":n+=r.em(a);break;case"codespan":n+=r.codespan(a);break;case"br":n+=r.br(a);break;case"del":n+=r.del(a);break;case"text":n+=r.text(a);break;default:{let o='Token with "'+a.type+'" type was not found.';if(this.options.silent)return console.error(o),"";throw new Error(o)}}}return n}},Rt=(ir=class{constructor(e){O(this,"options",void 0),O(this,"block",void 0),this.options=e||Le}preprocess(e){return e}postprocess(e){return e}processAllTokens(e){return e}emStrongMask(e){return e}provideLexer(e=this.block){return e?re.lex:re.lexInline}provideParser(e=this.block){return e?ne.parse:ne.parseInline}},O(ir,"passThroughHooks",new Set(["preprocess","postprocess","processAllTokens","emStrongMask"])),O(ir,"passThroughHooksRespectAsync",new Set(["preprocess","postprocess","processAllTokens"])),ir);function ke(e,t){if(Array.isArray(t))for(let r=0;r<t.length;r++)e.push(t[r]);else e.push(t)}var zo=class{constructor(...e){O(this,"defaults",Gr()),O(this,"options",this.setOptions),O(this,"parse",this.parseMarkdown(!0)),O(this,"parseInline",this.parseMarkdown(!1)),O(this,"Parser",ne),O(this,"Renderer",ur),O(this,"TextRenderer",sn),O(this,"Lexer",re),O(this,"Tokenizer",Je),O(this,"Hooks",Rt),this.use(...e)}walkTokens(e,t){let r=[];for(let n of e)switch(ke(r,t.call(this,n)),n.type){case"table":{let s=n;for(let i of s.header)ke(r,this.walkTokens(i.tokens,t));for(let i of s.rows)for(let a of i)ke(r,this.walkTokens(a.tokens,t));break}case"list":{let s=n;ke(r,this.walkTokens(s.items,t));break}default:{let s=n;this.defaults.extensions?.childTokens?.[s.type]?this.defaults.extensions.childTokens[s.type].forEach(i=>{let a=s[i].flat(1/0);ke(r,this.walkTokens(a,t))}):s.tokens&&ke(r,this.walkTokens(s.tokens,t))}}return r}use(...e){let t=this.defaults.extensions||{renderers:Object.create(null),childTokens:Object.create(null)};return e.forEach(r=>{let n={...r};if(n.async=this.defaults.async||n.async||!1,r.extensions&&(r.extensions.forEach(s=>{if(!s.name)throw new Error("extension name required");if("renderer"in s){let i=t.renderers[s.name];i?t.renderers[s.name]=function(...a){let o=s.renderer.apply(this,a);return o===!1&&(o=i.apply(this,a)),o}:t.renderers[s.name]=s.renderer}if("tokenizer"in s){if(!s.level||s.level!=="block"&&s.level!=="inline")throw new Error("extension level must be 'block' or 'inline'");let i=t[s.level];i?i.unshift(s.tokenizer):t[s.level]=[s.tokenizer],s.start&&(s.level==="block"?t.startBlock?t.startBlock.push(s.start):t.startBlock=[s.start]:s.level==="inline"&&(t.startInline?t.startInline.push(s.start):t.startInline=[s.start]))}"childTokens"in s&&s.childTokens&&(t.childTokens[s.name]=s.childTokens)}),n.extensions=t),r.renderer){let s=this.defaults.renderer||new ur(this.defaults);for(let i in r.renderer){if(!(i in s))throw new Error(`renderer '${i}' does not exist`);if(["options","parser"].includes(i))continue;let a=i,o=r.renderer[a],l=s[a];s[a]=(...u)=>{let d=o.apply(s,u);return d===!1&&(d=l.apply(s,u)),d===!1?"":d??""}}n.renderer=s}if(r.tokenizer){let s=this.defaults.tokenizer||new Je(this.defaults);for(let i in r.tokenizer){if(!(i in s))throw new Error(`tokenizer '${i}' does not exist`);if(["options","rules","lexer"].includes(i))continue;let a=i,o=r.tokenizer[a],l=s[a];s[a]=(...u)=>{let d=o.apply(s,u);return d===!1&&(d=l.apply(s,u)),d}}n.tokenizer=s}if(r.hooks){let s=this.defaults.hooks||new Rt;for(let i in r.hooks){if(!(i in s))throw new Error(`hook '${i}' does not exist`);if(["options","block"].includes(i))continue;let a=i,o=r.hooks[a],l=s[a];Rt.passThroughHooks.has(i)?s[a]=u=>{if(s.options.async&&Rt.passThroughHooksRespectAsync.has(i))return(async()=>{let p=await o.call(s,u);return l.call(s,p)})();let d=o.call(s,u);return l.call(s,d)}:s[a]=(...u)=>{if(s.options.async)return(async()=>{let p=await o.apply(s,u);return p===!1&&(p=await l.apply(s,u)),p})();let d=o.apply(s,u);return d===!1&&(d=l.apply(s,u)),d}}n.hooks=s}if(r.walkTokens){let s=this.defaults.walkTokens,i=r.walkTokens;n.walkTokens=function(a){let o=[];return ke(o,i.call(this,a)),s&&ke(o,s.call(this,a)),o}}this.defaults={...this.defaults,...n}}),this}setOptions(e){return this.defaults={...this.defaults,...e},this}lexer(e,t){return re.lex(e,t??this.defaults)}parser(e,t){return ne.parse(e,t??this.defaults)}parseMarkdown(e){return(t,r)=>{let n={...r},s={...this.defaults,...n},i=this.onError(!!s.silent,!!s.async);if(this.defaults.async===!0&&n.async===!1)return i(new Error("marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise."));if(typeof t>"u"||t===null)return i(new Error("marked(): input parameter is undefined or null"));if(typeof t!="string")return i(new Error("marked(): input parameter is of type "+Object.prototype.toString.call(t)+", string expected"));if(s.hooks&&(s.hooks.options=s,s.hooks.block=e),s.async)return(async()=>{let a=s.hooks?await s.hooks.preprocess(t):t,o=await(s.hooks?await s.hooks.provideLexer(e):e?re.lex:re.lexInline)(a,s),l=s.hooks?await s.hooks.processAllTokens(o):o;s.walkTokens&&await Promise.all(this.walkTokens(l,s.walkTokens));let u=await(s.hooks?await s.hooks.provideParser(e):e?ne.parse:ne.parseInline)(l,s);return s.hooks?await s.hooks.postprocess(u):u})().catch(i);try{s.hooks&&(t=s.hooks.preprocess(t));let a=(s.hooks?s.hooks.provideLexer(e):e?re.lex:re.lexInline)(t,s);s.hooks&&(a=s.hooks.processAllTokens(a)),s.walkTokens&&this.walkTokens(a,s.walkTokens);let o=(s.hooks?s.hooks.provideParser(e):e?ne.parse:ne.parseInline)(a,s);return s.hooks&&(o=s.hooks.postprocess(o)),o}catch(a){return i(a)}}}onError(e,t){return r=>{if(r.message+=`
Please report this to https://github.com/markedjs/marked.`,e){let n="<p>An error occurred:</p><pre>"+J(r.message+"",!0)+"</pre>";return t?Promise.resolve(n):n}if(t)return Promise.reject(r);throw r}}},De=new zo;function A(e,t){return De.parse(e,t)}A.options=A.setOptions=function(e){return De.setOptions(e),A.defaults=De.defaults,Fs(A.defaults),A},A.getDefaults=Gr,A.defaults=Le;function Bo(...e){return De.use(...e),A.defaults=De.defaults,Fs(A.defaults),A}A.use=Bo,A.walkTokens=function(e,t){return De.walkTokens(e,t)},A.parseInline=De.parseInline,A.Parser=ne,A.parser=ne.parse,A.Renderer=ur,A.TextRenderer=sn,A.Lexer=re,A.lexer=re.lex,A.Tokenizer=Je,A.Hooks=Rt,A.parse=A;var nl=A.options,sl=A.setOptions,il=A.walkTokens,al=A.parseInline,ol=ne.parse,ll=re.lex;A.use({gfm:!0,breaks:!0,renderer:{link({href:e,title:t,text:r}){return`<a href="${e.startsWith("javascript:")?"#":e}" target="_blank" rel="noopener noreferrer"${t?` title="${t}"`:""}>${r}</a>`}}});function Do(e){return e.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,"").replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,"").replace(/\son\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi,"")}function ti(e){if(!e)return"";try{return Do(A.parse(e))}catch(t){return console.warn("[Schedulux Widget] Markdown parse error:",t),e}}function No(e){if(!e)return"";try{const t=new Date(e);return Number.isNaN(t.getTime())?"":t.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}catch{return""}}function Wo({message:e}){const t=e.role==="user",r=e.delivery_status==="pending",n=No(e.created_at),s=ut(()=>ti(e.content||""),[e.content]);return g("div",{className:`schedulux-msg-row ${t?"user":"agent"} ${r?"is-pending":""}`,style:r?{opacity:.72}:void 0,children:[g("div",{className:"schedulux-bubble",children:[g("div",{className:"schedulux-markdown",dangerouslySetInnerHTML:{__html:s}}),e.booking_reference&&g("div",{className:"schedulux-booking-card",children:[g("div",{className:"schedulux-booking-header",children:[g(Ia,{size:16}),g("span",{children:"Appointment Confirmed"})]}),g("div",{className:"schedulux-booking-ref",children:["Ref: ",e.booking_reference]})]})]}),g("div",{className:"schedulux-msg-time",children:[n,r&&" • sending..."]})]})}function Qo({messages:e,isTyping:t,quickPrompts:r=[],onSelectPrompt:n,hasOlderMessages:s=!1,isLoadingOlder:i=!1,onLoadOlder:a}){const o=Qe(null),l=Qe(null),u=Qe(e.length),d=Qe(0),p=Qe(!1);ce(()=>{const v=u.current,m=e.length;if(u.current=m,p.current&&o.current){const k=o.current.scrollHeight-d.current;o.current.scrollTop+=k,p.current=!1;return}(m>v||t)&&l.current?.scrollIntoView({behavior:"smooth"})},[e,t]);const h=v=>{const m=v.currentTarget;m.scrollTop<=20&&s&&!i&&a&&(p.current=!0,d.current=m.scrollHeight,a())},f=()=>{o.current&&s&&!i&&a&&(p.current=!0,d.current=o.current.scrollHeight,a())},_=r.length>0&&e.length<=2;return g("div",{ref:o,className:"schedulux-messages",onScroll:h,children:[s&&g("div",{className:"schedulux-load-older",children:i?g("span",{className:"schedulux-loading-older-text",children:"Loading earlier messages..."}):g("button",{type:"button",onClick:f,className:"schedulux-load-older-btn",children:"Load earlier messages"})}),e.map((v,m)=>g(Wo,{message:v},v.id||`msg_${m}`)),_&&g("div",{className:"schedulux-quick-prompts",children:r.map(v=>g("button",{type:"button",className:"schedulux-prompt-chip",onClick:()=>n(v),children:v},v))}),t&&g("div",{className:"schedulux-typing",children:[g("span",{className:"schedulux-typing-dot"}),g("span",{className:"schedulux-typing-dot"}),g("span",{className:"schedulux-typing-dot"})]}),g("div",{ref:l,style:{height:1}})]})}function qo({config:e,onClose:t,onReset:r,inline:n=!1}){const s=e.agent_name||"AI Assistant",i=e.agent_subtitle||"Typically replies instantly",a=e.avatar_url||e.logo_url;return g("div",{className:"schedulux-header",children:[g("div",{className:"schedulux-header-brand",children:[g("div",{className:"schedulux-avatar",children:a?g("img",{src:a,alt:s}):g(Oa,{className:"schedulux-avatar-icon",size:20})}),g("div",{className:"schedulux-header-titles",children:[g("div",{className:"schedulux-title-row",children:[g("span",{className:"schedulux-header-title",children:s}),g("span",{className:"schedulux-status-dot",title:"Live Agent Active"})]}),g("span",{className:"schedulux-header-subtitle",children:i})]})]}),g("div",{className:"schedulux-header-actions",children:[g("button",{type:"button",onClick:r,className:"schedulux-header-btn",title:"Reset conversation","aria-label":"Reset conversation",children:g(Aa,{size:15})}),!n&&t&&g("button",{type:"button",onClick:t,className:"schedulux-header-btn",title:"Minimize chat","aria-label":"Minimize chat",children:g(Es,{size:16})})]})]})}function jo({input:e,setInput:t,onSend:r,disabled:n,placeholder:s="Type a message or ask a question..."}){const i=Qe(null),a=d=>{if(d.key==="Enter"&&!d.shiftKey){d.preventDefault();const p=e.trim();p&&!n&&(r(p),t(""),i.current&&(i.current.style.height="auto"))}},o=d=>{const p=d.target.value;t(p),i.current&&(i.current.style.height="auto",i.current.style.height=`${Math.min(i.current.scrollHeight,80)}px`)},l=()=>{const d=e.trim();d&&!n&&(r(d),t(""),i.current&&(i.current.style.height="auto"))},u=!!e.trim()&&!n;return g("div",{className:"schedulux-footer",children:[g("div",{className:"schedulux-input-box",children:[g("textarea",{ref:i,rows:1,value:e,onInput:o,onKeyDown:a,placeholder:s,disabled:n,className:"schedulux-textarea","aria-label":"Chat input message"}),g("button",{type:"button",onClick:l,disabled:!u,className:"schedulux-send-btn",title:"Send message","aria-label":"Send message",children:g(Ta,{size:16})})]}),g("div",{className:"schedulux-powered-by",children:["Powered by"," ",g("a",{href:"https://schedulux.ai",target:"_blank",rel:"noopener noreferrer",children:"Schedulux AI"})]})]})}function Uo({config:e,isOpen:t,onToggle:r}){const n=e.launcher_style||"bubble",s=e.launcher_icon||"chat",i=()=>{if(t)return g(Es,{size:22});switch(s){case"calendar":return g(Ca,{size:22});case"help":return g(Ma,{size:22});default:return g(Ra,{size:22})}},a=e.launcher_style==="pill"||e.launcher_style==="bar"?t?"Close":"Book with AI":null;return g("button",{type:"button",onClick:r,className:`schedulux-launcher style-${n}`,"aria-label":t?"Close chat":"Open chat",children:[i(),a&&g("span",{children:a}),!t&&g("span",{className:"schedulux-launcher-badge"})]})}function ri(){try{const e=window.AudioContext||window.webkitAudioContext;if(!e)return;const t=new e,r=t.createOscillator(),n=t.createGain();r.type="sine",r.frequency.setValueAtTime(587.33,t.currentTime),r.frequency.exponentialRampToValueAtTime(880,t.currentTime+.15),n.gain.setValueAtTime(.08,t.currentTime),n.gain.exponentialRampToValueAtTime(.001,t.currentTime+.35),r.connect(n),n.connect(t.destination),r.start(),r.stop(t.currentTime+.35)}catch{}}function ni({options:e,config:t}){const[r,n]=le(!!e.inline),[s,i]=le(""),{messages:a,isTyping:o,hasOlderMessages:l,isFetchingOlderMessages:u,loadOlderMessages:d,sendMessage:p,resetSession:h}=Pa({options:e,config:t}),f=t.quick_prompts||["What services do you provide?","Check available appointment times","What are your operating hours?"];ce(()=>{if(t.auto_expand_delay_seconds&&t.auto_expand_delay_seconds>0){const m=setTimeout(()=>{n(!0)},t.auto_expand_delay_seconds*1e3);return()=>clearTimeout(m)}},[t.auto_expand_delay_seconds]),ce(()=>{if(t.sound_on_load){const m=setTimeout(()=>{ri()},500);return()=>clearTimeout(m)}},[t.sound_on_load]);const _=Pe(()=>{n(m=>{const k=!m;return e.onToggle?.(k),k})},[e]),v=Pe(async m=>{!m.trim()||o||(await p(m.trim()),ri())},[o,p]);return g("div",{className:`schedulux-root ${e.inline?"is-inline":""}`,children:[g("div",{className:`schedulux-window ${r?"is-open":""}`,children:[g(qo,{config:t,onClose:()=>n(!1),onReset:h,inline:e.inline}),g(Qo,{messages:a,isTyping:o,quickPrompts:f,onSelectPrompt:v,hasOlderMessages:l,isLoadingOlder:u,onLoadOlder:()=>d()}),g(jo,{input:s,setInput:i,onSend:v,disabled:o,placeholder:t.placeholder_text})]}),!e.inline&&g(Uo,{config:t,isOpen:r,onToggle:_})]})}var hr=4.5,Ho=3,Ko="#4F46E5",si="#0F172A",et="#FFFFFF",an="#000000",ii=.179,Zo='system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',tt=(e,t,r)=>Math.min(r,Math.max(t,e));function dr(e){if(!e)return null;const t=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(e.trim());if(!t)return null;let r=t[1];return r.length===3&&(r=r.split("").map(n=>n+n).join("")),[parseInt(r.slice(0,2),16),parseInt(r.slice(2,4),16),parseInt(r.slice(4,6),16)]}function rt(e){return dr(e)??[0,0,0]}function pr(e,t,r){const n=s=>tt(Math.round(s),0,255).toString(16).padStart(2,"0").toUpperCase();return`#${n(e)}${n(t)}${n(r)}`}function ai(e,t){const r=dr(e);return r?pr(...r):t}var we=e=>{const t=dr(e);return t?pr(...t):void 0};function Ct(e,t,r){const n=s=>{const i=s/255;return i<=.04045?i/12.92:Math.pow((i+.055)/1.055,2.4)};return .2126*n(e)+.7152*n(t)+.0722*n(r)}function oi(e,t){return(Math.max(e,t)+.05)/(Math.min(e,t)+.05)}function pe(e,t){return oi(Ct(...rt(e)),Ct(...rt(t)))}function li(e,t=si,r=et){const n=pe(e,r),s=pe(e,t);return Math.max(n,s)>=hr?n>=s?r:t:pe(e,et)>=pe(e,an)?et:an}function on(e,t=si,r=et){const{L:n,C:s}=fr(e),i=pe(e,r);return i>=hr||n<=.73&&s>=.12&&i>=2.7?r:li(e,t,r)}var Go=e=>{const t=e/255;return t<=.04045?t/12.92:Math.pow((t+.055)/1.055,2.4)},ln=e=>(e<=.0031308?e*12.92:1.055*Math.pow(e,1/2.4)-.055)*255;function fr(e){const[t,r,n]=rt(e).map(Go),s=Math.cbrt(.4122214708*t+.5363325363*r+.0514459929*n),i=Math.cbrt(.2119034982*t+.6806995451*r+.1073969566*n),a=Math.cbrt(.0883024619*t+.2817188376*r+.6299787005*n),o=.2104542553*s+.793617785*i-.0040720468*a,l=1.9779984951*s-2.428592205*i+.4505937099*a,u=.0259040371*s+.7827717662*i-.808675766*a;return{L:o,C:Math.hypot(l,u),h:(Math.atan2(u,l)*180/Math.PI+360)%360}}function nt(e,t,r){const n=tt(e,0,1);let s=t,i=[0,0,0];for(let a=0;a<30;a++){const o=s*Math.cos(r*Math.PI/180),l=s*Math.sin(r*Math.PI/180),u=Math.pow(n+.3963377774*o+.2158037573*l,3),d=Math.pow(n-.1055613458*o-.0638541728*l,3),p=Math.pow(n-.0894841775*o-1.291485548*l,3),h=[4.0767416621*u-3.3077115913*d+.2309699292*p,-1.2684380046*u+2.6097574011*d-.3413193965*p,-.0041960863*u-.7034186147*d+1.707614701*p];if(i=[ln(tt(h[0],0,1)),ln(tt(h[1],0,1)),ln(tt(h[2],0,1))],h.every(f=>f>=-1e-4&&f<=1.0001)||s<1e-4)break;s*=.92}return pr(...i)}function cn(e,t,r=.25,n=.92){const s=tt(e.L+t,r,n),i=e.h>=35&&e.h<=105&&t<0?t*35:0,a=(e.h+i+360)%360;return nt(s,t<0?Math.min(e.C*1.05,.28):e.C,a)}function ci(e,t,r=hr){if(pe(e,t)>=r)return e;const{L:n,C:s,h:i}=fr(e),a=Ct(...rt(t))>ii?-1:1;for(let o=1;o<=50;o++){const l=nt(n+a*o*.02,s,i);if(pe(l,t)>=r)return l}return a<0?an:et}var Vo=/^\d+(\.\d+)?(px|rem|em|%)$/;function Xo(){return typeof window<"u"&&typeof window.matchMedia=="function"&&window.matchMedia("(prefers-color-scheme: dark)").matches}function ui(e,t={}){const r=ai(e?.primary_color,Ko),n=e?.theme_mode??"light",s=we(e?.background_color);let i=n==="dark"||n==="auto"&&(t.prefersDark??Xo());s&&(i=Ct(...rt(s))<ii);const a=fr(r),o=we(e?.secondary_color)??(i?cn(a,.06,.35,.88):cn(a,-.05,.25,.85)),l=s??(i?"#0F172A":et),u=we(e?.header_background)??(i?"#1E293B":a.L>.78?r:cn(a,-.03,.3,.72)),d=we(e?.header_text_color)??on(u),p=we(e?.user_bubble_bg)??r,h=we(e?.user_bubble_text)??on(p),f=we(e?.agent_bubble_bg)??(i?nt(.24,Math.min(a.C*.08,.015),a.h):nt(.968,Math.min(a.C*.05,.008),a.h)),_=i?"#F8FAFC":nt(.22,Math.min(a.C*.08,.015),a.h);return{primary_color:r,secondary_color:o,background_color:l,header_background:u,header_text_color:d,user_bubble_bg:p,user_bubble_text:h,agent_bubble_bg:f,agent_bubble_text:we(e?.agent_bubble_text)??ci(_,f),border_radius:e?.border_radius&&Vo.test(e.border_radius)?e.border_radius:"16px",font_family:e?.font_family&&e.font_family!=="inherit"?e.font_family:Zo,theme_mode:n}}function Yo(e){return[["header",e.header_text_color,e.header_background,Ho],["user_bubble",e.user_bubble_text,e.user_bubble_bg,2.7],["agent_bubble",e.agent_bubble_text,e.agent_bubble_bg,hr]].map(([t,r,n,s])=>({pair:t,ratio:Math.round(pe(r,n)*100)/100,min:s})).filter(t=>t.ratio<t.min).map(({pair:t,ratio:r})=>({pair:t,ratio:r}))}function un(e,t){const r=ui(e?.theme),n=r.primary_color,s=r.secondary_color,i=r.background_color,a=r.header_background,o=r.header_text_color,l=r.user_bubble_bg,u=r.user_bubble_text,d=r.agent_bubble_bg,p=r.agent_bubble_text,h=r.border_radius,f=r.font_family,_=e?.bottom_spacing_px??20,v=e?.side_spacing_px??20,m=e?.position||"bottom-right",k=m.includes("left"),x=m.includes("top");return`
    :host {
      display: ${t?"block":"contents"};
      width: 100%;
      height: 100%;
      min-height: 0;
      --schedulux-primary: ${n};
      --schedulux-secondary: ${s};
      --schedulux-bg: ${i};
      --schedulux-header-bg: ${a};
      --schedulux-header-text: ${o};
      --schedulux-user-bubble-bg: ${l};
      --schedulux-user-bubble-text: ${u};
      --schedulux-agent-bubble-bg: ${d};
      --schedulux-agent-bubble-text: ${p};
      --schedulux-radius: ${h};
      --schedulux-font: ${f};
      --schedulux-pos-bottom: ${_}px;
      --schedulux-pos-side: ${v}px;
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
      ${t?"width: 100%; height: 100%; top: auto; bottom: auto; left: auto; right: auto;":x?"top: var(--schedulux-pos-bottom);":"bottom: var(--schedulux-pos-bottom);"}
      ${t?"":k?"left: var(--schedulux-pos-side);":"right: var(--schedulux-pos-side);"}
      z-index: ${t?"1":"2147483647"};
      display: flex;
      flex-direction: column;
      min-height: 0;
      ${t?"align-items: stretch;":k?"align-items: flex-start;":"align-items: flex-end;"}
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
      transform-origin: ${k?"bottom left":"bottom right"};
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

    /* Markdown Styling Inside Message Bubbles */
    .schedulux-markdown {
      word-break: break-word;
    }

    .schedulux-markdown p {
      margin: 0 0 8px 0;
    }

    .schedulux-markdown p:last-child {
      margin-bottom: 0;
    }

    .schedulux-markdown strong,
    .schedulux-markdown b {
      font-weight: 700;
    }

    .schedulux-markdown em,
    .schedulux-markdown i {
      font-style: italic;
    }

    .schedulux-markdown ul,
    .schedulux-markdown ol {
      margin: 6px 0 8px 0;
      padding-left: 18px;
    }

    .schedulux-markdown li {
      margin-bottom: 3px;
    }

    .schedulux-markdown a {
      color: inherit;
      text-decoration: underline;
      font-weight: 600;
      transition: opacity 0.15s ease;
    }

    .schedulux-markdown a:hover {
      opacity: 0.8;
    }

    .schedulux-markdown code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 11.5px;
      background: rgba(0, 0, 0, 0.06);
      padding: 2px 5px;
      border-radius: 4px;
    }

    .schedulux-markdown pre {
      margin: 8px 0;
      padding: 8px 10px;
      background: rgba(0, 0, 0, 0.06);
      border-radius: 6px;
      overflow-x: auto;
    }

    .schedulux-markdown pre code {
      background: none;
      padding: 0;
    }

    /* Markdown Tables */
    .schedulux-markdown table {
      display: block;
      width: 100%;
      max-width: 100%;
      overflow-x: auto;
      border-collapse: collapse;
      margin: 10px 0;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.09);
      font-size: 12px;
      line-height: 1.4;
      background: rgba(255, 255, 255, 0.45);
      -webkit-overflow-scrolling: touch;
    }

    .schedulux-markdown th {
      background: rgba(0, 0, 0, 0.04);
      font-weight: 700;
      padding: 7px 10px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.09);
      border-right: 1px solid rgba(0, 0, 0, 0.05);
      text-align: left;
      white-space: nowrap;
    }

    .schedulux-markdown td {
      padding: 7px 10px;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
      border-right: 1px solid rgba(0, 0, 0, 0.05);
      vertical-align: top;
    }

    .schedulux-markdown tr:last-child td {
      border-bottom: none;
    }

    .schedulux-markdown th:last-child,
    .schedulux-markdown td:last-child {
      border-right: none;
    }

    /* User Bubble Markdown Contrasts */
    .schedulux-msg-row.user .schedulux-markdown code {
      background: rgba(255, 255, 255, 0.18);
    }

    .schedulux-msg-row.user .schedulux-markdown pre {
      background: rgba(255, 255, 255, 0.14);
    }

    .schedulux-msg-row.user .schedulux-markdown table {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.18);
    }

    .schedulux-msg-row.user .schedulux-markdown th {
      background: rgba(255, 255, 255, 0.12);
      border-bottom-color: rgba(255, 255, 255, 0.18);
      border-right-color: rgba(255, 255, 255, 0.08);
    }

    .schedulux-msg-row.user .schedulux-markdown td {
      border-bottom-color: rgba(255, 255, 255, 0.08);
      border-right-color: rgba(255, 255, 255, 0.08);
    }

    /* Dark Mode Markdown Contrasts */
    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown table {
      background: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.12);
    }

    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown th {
      background: rgba(255, 255, 255, 0.06);
      border-bottom-color: rgba(255, 255, 255, 0.12);
      border-right-color: rgba(255, 255, 255, 0.06);
    }

    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown td {
      border-bottom-color: rgba(255, 255, 255, 0.06);
      border-right-color: rgba(255, 255, 255, 0.06);
    }

    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown code {
      background: rgba(255, 255, 255, 0.1);
    }

    .schedulux-container.dark .schedulux-msg-row.agent .schedulux-markdown pre {
      background: rgba(255, 255, 255, 0.08);
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
  `}var st=new Map;function hn(e){const t=`${e.tenantId}_${e.agentId}`;if(st.has(t)){const p=st.get(t);if(p)return p}const r=!!e.container,n=e.container||document.createElement("div");r||(n.id=`schedulux-widget-${e.tenantId}-${e.agentId}`,document.body.appendChild(n));const s=n.shadowRoot||n.attachShadow({mode:"open"});s.innerHTML="";const i=document.createElement("style");let a={...e.config};i.textContent=un(a,e.inline),s.appendChild(i);const o=document.createElement("div");o.className="schedulux-mount-root",s.appendChild(o);const l=new la({defaultOptions:{queries:{retry:1,staleTime:3e5,refetchOnWindowFocus:!1}}}),u=p=>{Mn(ot(Ei,{client:l},ot(ni,{options:e,config:p})),o)};u(a);const d={open:()=>{s.querySelector(".schedulux-window")?.classList.add("is-open")},close:()=>{s.querySelector(".schedulux-window")?.classList.remove("is-open")},toggle:()=>{s.querySelector(".schedulux-window")?.classList.toggle("is-open")},isOpen:()=>!!s.querySelector(".schedulux-window")?.classList.contains("is-open"),sendMessage:async p=>{const h=s.querySelector(".schedulux-textarea"),f=s.querySelector(".schedulux-send-btn");h&&f&&(h.value=p,h.dispatchEvent(new Event("input",{bubbles:!0})),f.click())},resetConversation:()=>{s.querySelector('button[aria-label="Reset conversation"]')?.click()},updateConfig:p=>{a={...a,...p,theme:{...a.theme||{},...p.theme||{}}},i.textContent=un(a,e.inline),u(a)},destroy:()=>{l.clear(),Mn(null,o),r?s.innerHTML="":n.remove(),st.delete(t)}};return st.set(t,d),Sa(e.apiBase||"",e.tenantId,e.agentId,e.mode||"live").then(p=>{if(p&&Object.keys(p).length>0){const h={...p.theme||{},...e.config?.theme||{}},f={...p,...e.config,theme:h};d.updateConfig(f)}}).catch(p=>{console.warn("[Schedulux Widget] Remote config fetch fallback:",p)}),d}function hi(e,t){const r=`${e}_${t}`,n=st.get(r);n&&n.destroy()}if(typeof window<"u"){window.ScheduluxWidget={init:hn,destroy:hi,instances:st};const e=document.currentScript||document.querySelector("script[data-tenant-id][data-agent-id]");if(e){const t=e.getAttribute("data-tenant-id"),r=e.getAttribute("data-agent-id"),n=e.getAttribute("data-api-base")||"";if(t&&r){const s=e.getAttribute("data-primary-color"),i=e.getAttribute("data-agent-name"),a=e.getAttribute("data-greeting"),o=e.getAttribute("data-position"),l=e.getAttribute("data-theme-mode");hn({tenantId:t,agentId:r,apiBase:n,config:{agent_name:i||void 0,initial_greeting:a||void 0,position:o||void 0,theme:{primary_color:s||void 0,theme_mode:l||void 0}}})}}}j.ChatWidget=ni,j.auditTheme=Yo,j.contrastBetween=pe,j.destroyScheduluxWidget=hi,j.ensureContrast=ci,j.getBrandContrastColor=on,j.getContrastColor=li,j.getContrastRatio=oi,j.getRelativeLuminance=Ct,j.getWidgetStyles=un,j.hexToOklch=fr,j.hexToRgb=rt,j.initScheduluxWidget=hn,j.normalizeHex=ai,j.oklchToHex=nt,j.parseHex=dr,j.renderMarkdown=ti,j.resolveTheme=ui,j.rgbToHex=pr})(this.ScheduluxWidgetBundle=this.ScheduluxWidgetBundle||{});
