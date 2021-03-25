export class SwipeToDeleteController {
  constructor(slider_query_selector) {
    this.elements = new Map();
    this.slider_query_selector = slider_query_selector;
  }
  add(html_element, delete_callback) {
    html_element.addEventListener("mousedown",this);
    html_element.addEventListener("touchstart",this);
    html_element.addEventListener("touchend",this);
    html_element.addEventListener("touchmove",this);
    html_element.addEventListener("touchcancel",this);
    this.elements.set(html_element,{clientX: 0,mov: 0,cb: delete_callback});
  }
  handleEvent(e) {
    let param;
    let my_touch;
    switch(e.type) {
      case "mousedown":
        e.preventDefault();
        this.in_motion=e.currentTarget;
        this.in_motion.removeEventListener("mousedown",this);
        document.body.addEventListener("mousemove",this);
        document.body.addEventListener("mouseup",this);
        this.startslide(e);
        break;
      case "mouseup":
        document.body.removeEventListener("mouseup",this);
        document.body.removeEventListener("mousemove",this);
        this.in_motion.addEventListener("mousedown",this);
        this.stopslide(e);
        break;
      case "mousemove":
        e.preventDefault();
        this.slidebox(e);
        break;
      case "touchstart":
        //e.preventDefault();
        const first_touch = e.changedTouches[0];
        this.master_touch = first_touch.identifier;
        this.in_motion=e.currentTarget;
        this.startslide(first_touch);
        break;
      case "touchmove":
        if(my_touch = this.findTouch(e)) {
          this.slidebox(my_touch);
        }
        break;
      case "touchend":
      case "touchcancel":
        if(my_touch = this.findTouch(e)){
          this.stopslide(my_touch);
        }
        break;
    }
  }
  findTouch(e) {
    let my_touch;
    for(let touches = e.changedTouches, i = 0;
      i < touches.length && (my_touch = touches[i]).identifier != this.master_touch;
      i++);
    if(my_touch.identifier === this.master_touch){ //successfull search
      return my_touch;
    }
    return null;
  }
  startslide(e) {
    const param = this.elements.get(this.in_motion);
    param.clientX = e.clientX;
    const styles = window.getComputedStyle(this.in_motion);
    const elm_height= +styles.height.replace("px","");
    const elm_width = +styles.width.replace("px","");
    param.delete_threshold = -(elm_width * 0.8)
    param.element_width = elm_width;
    var parent_cont_width=0;
    for (const child of this.in_motion.parentElement.childNodes){
      parent_cont_width += +window.getComputedStyle(child).width.replace("px","");
    }
    param.slide_open_threshold = -(
      +window.getComputedStyle(this.in_motion.parentElement.lastChild)
      .flexBasis.replace("px","")
    );
    param.mov= param.element_width - parent_cont_width;
    param.state = '';
  }
  slidebox(e) {
    const htelm = this.in_motion.parentElement;
    const param = this.elements.get(this.in_motion);
    //slidecontrol
    param.mov += e.clientX - param.clientX;
    param.clientX = e.clientX;
    if(param.state != 'deleting' && param.mov < param.delete_threshold){
      htelm.dispatchEvent(new Event('RS_deleting'));
      param.state = 'deleting';
    } else if(param.state != 'open' &&
      param.mov > param.delete_threshold &&
      param.mov < param.slide_open_threshold
    ){
      htelm.dispatchEvent(new Event('RS_open'));
      param.state = 'open';
    } else if(param.state != 'closed' &&
      param.mov > param.slide_open_threshold
    ){
      htelm.dispatchEvent(new Event('RS_close'));
      param.state = 'closed';
    }
    if (param.mov > 0) {
      htelm.style.width = param.element_width;
    } else {
      htelm.style.width = param.element_width - param.mov;
    }
  }
  stopslide(e) {
    this.master_touch=null;
    this.in_motion.parentElement.style.width="";
    this.in_motion.dispatchEvent(new Event("RS_slideEnd",{bubbles:true}));
  }
  swipeOut(elem){
    var transition_seconds = 0.2;
    return new Promise((resolve, reject) => {
      const triggerDestroy = function(e){
        if(e.propertyName == 'width'){
          this.removeEventListener('transitionend', triggerDestroy);
          this.style.transition = "";
          resolve();
        }
      };
      elem.addEventListener('transitionend',triggerDestroy);
      elem.style.transition = `width ${transition_seconds}s`;
      elem.style.width = '200%';
      mylib.defer(transition_seconds * 1000 + 50).then(() => {
        //50ms after the transition should have ended.
        elem.removeEventListener('transitionend', triggerDestroy);
        this.style.transition = '';
        reject();
      });
    });
  }
}
