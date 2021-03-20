export class SwipeToDeleteController {
  constructor() {
    this.elements = new Map();
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
    param.mov= +styles.left.replace("px","");
    param.slide_open_threshold = -elm_height;
    param.move_slow_threshold = -elm_height * 2;
    param.delete_threshold = -((elm_width - elm_height * 2) * 0.3 + elm_height * 2);
    param.element_width = elm_width;
  }
  slidebox(e) {
    const htelm = this.in_motion;
    const param = this.elements.get(htelm);
    //slidecontrol
    param.mov += e.clientX - param.clientX;
    param.clientX = e.clientX;
    if(param.mov < param.delete_threshold){
      htelm.style.left = -(param.element_width * 0.95);
    } else if (param.mov < param.move_slow_threshold) {
      htelm.style.left = param.mov * 0.3 + param.move_slow_threshold * 0.7;
    } else if (param.mov > 0) {
      htelm.style.left = 0;
    } else {
      htelm.style.left = param.mov;
    }
  }
  stopslide(e) {
    this.master_touch=null;
    this.in_motion.style.left="";
  }
}
