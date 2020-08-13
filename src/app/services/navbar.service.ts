import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NavbarService {

  constructor() { }

  barsClicked(){
    var sidebar = document.getElementById('sidebar');
    var wideSidebar = document.getElementById('wide-side-bar');
    var cover = document.getElementById('cover-all-pages');
    if(wideSidebar.style.display == "none" || wideSidebar.style.display == ""){
      sidebar.style.width = "235px";
      sidebar.style.overflow = "scroll";
      wideSidebar.style.display = "block";
      cover.style.display = "block";
      document.body.style.backgroundColor = "#afafaf";
    }else{
      sidebar.style.width = "0";
      sidebar.style.overflow = "hidden";
      wideSidebar.style.display = "none";
      cover.style.display = "none";
      document.body.style.backgroundColor = "rgb(245, 245, 245)";
    }
  }
}
