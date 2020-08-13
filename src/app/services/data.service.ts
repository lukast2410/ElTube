import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  month = [
    "Jan", "Feb", "Mar", "Apr", "May", "June", 
    "July", "Aug", "Sept", "Okt", "Nov", "Dec" 
  ] 

  constructor() { }

  formatVideoDuration(totalSeconds: number): string{
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = Math.floor(totalSeconds % 60);
  
    if(hours > 0){
      return String(hours).padStart(2, "0") + ":" + 
      String(minutes).padStart(2, "0") + ":" + String(seconds).padStart(2, "0");
    }else{
      return String(minutes).padStart(2, "0") + 
      ":" + String(seconds).padStart(2, "0");
    }
  }

  shortenThousand(numb: number): string{
    let suffix = ["", "K", "M", "B"];
    for(let i = 0; i < suffix.length; i++){
        let divide = numb / Math.pow(1000, i);
        if(divide < 1000){
          let word = divide.toString();
          if(word.length > 3){
            let index = word.indexOf('.');
            if(index == 1) return word.substring(0, 3) + " " + suffix[i];
            else if(index > 1) return word.substring(0, index) + " " + suffix[i];
          }else{
            return word + " " + suffix[i];
          }
          break;
        }
    }

  }
  
  shortenComa(numb: number): string{
    let numbW = numb.toString();
    let length = numb.toString().length;
    let word = "";
    for(let i = length - 3; i > 0 ; i-=3){
      word = "," + numbW.substring(i, length) + word;
      length -= 3;
    }
    let mod = numb.toString().length % 3;
    if(mod == 0){
      word = numbW.substring(0, 3) + word;
    }else{
      word = numbW.substring(0, mod) + word;   
    }
    return word;
  }

  formatPublishDate(video: any): string{
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();
    let hours = date.getHours();
    // console.log("hour: " + hours + " video: " + video.hours);
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    let publishDate = ""

    let result = 0;
    if(video.year < year){
      result = (year - video.year);
      publishDate = result.toString() + " year";
    }else if(video.month < month){
      result = (month - video.month);
      publishDate = result.toString() + " month";
    }else if(video.day < day){
      result = (day - video.day);
      publishDate = result.toString() + " day";
    }else if(video.hours < hours){
      result = (hours - video.hours);
      publishDate = result.toString() + " hour"
    }else if(video.minutes < minutes){
      result = (minutes - video.minutes);
      publishDate = result.toString() + " minute"
    }else{
      result = (seconds - video.seconds);
      publishDate = result.toString() + " second"
    }

    if(result > 1){
      publishDate += "s ago"
    }else{
      publishDate += " ago"
    }

    return publishDate;
  }

  formatDate(video: any): string{
    return this.month[video.month - 1] + " " + video.day +
    ", " + video.year;
  }

  formatLastUpdated(v: any): string{
    let date = new Date();
    let year = date.getFullYear();
    let month = date.getMonth() + 1;
    let day = date.getDate();

    if(v.day == day && v.month == month && v.year == year){
      return "Updated today"
    }else{
      return "Last updated on " + this.formatDate(v);
    }
  }
}
