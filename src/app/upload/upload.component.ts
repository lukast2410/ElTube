import { Component, OnInit, OnChanges } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from 'angularfire2/storage'
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { async } from '@angular/core/testing';
import { RouterLink, Router } from '@angular/router';
import { Location } from '@angular/common';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from '../services/data.service';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent implements OnInit, OnChanges {
  GET_VIDEOS = gql `
    query GetAllVideos{
      getAllVideos{
        id
        channel_id
        title
        description
        views
        like
        dislike
        comment
        visibility
        restrict
        day
        month
        year
        hours
        minutes
        seconds
        video_path
        thumbnail_path
        category
        location
        premium
        duration
      }
    }
  `

  //user
  users = [];
  user = null;
  loggedIn = false;

  //upload
  task: AngularFireUploadTask;
  thumbnailTask: AngularFireUploadTask;
  percentage: Observable<number>;
  snapshot: Observable<any>;
  thumbnailSnap: Observable<any>;
  thumbnailPercentage: Observable<number>;
  filename: string;
  downloadURL: string;
  isHovering: boolean;
  dropped: boolean;
  first: boolean;
  error: boolean;
  second: boolean;
  uploadDone: boolean;
  thumbnailUploaded: boolean;
  thumbnailName: string;
  thumbnailDownloadURL: string;
  duration: string;

  //from db
  channel;
  video;
  
  //data video
  videoPath: string;
  thumbnailPath: string;
  videoTitle: string;
  videoDesc: string;
  videoCategory: string;
  ageRestrict: boolean;
  videoPrivacy: string;
  videoPremium: boolean;
  videoDuration: number;

  //link videonya
  videoLink: string;

  constructor(private storage: AngularFireStorage, private router: Router,
    private location: Location, private apollo: Apollo, private data: DataService) { }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
      this.location.back();
    }
    else{
      this.getUserFromStorage();
    }
    this.videoLink = "http://localhost:4200/watch/";
    // this.videoLink = "https://eltube-263a1.web.app/watch/";
    this.dropped = false;
    this.first = true;
    this.second = false;
    this.uploadDone = false;
    this.thumbnailUploaded = false;
    this.error = false;
    this.videoTitle = "test";
    this.videoDesc = "";
    this.videoCategory = "music"
    this.ageRestrict = false;
    this.videoPrivacy = "public";
    this.videoPremium = false;
    this.getOneChannel();
  }

  ngOnChanges(){
    if(this.videoTitle.length == 0){
      document.getElementById('input-title').style.border = "solid red 2px";
    }else if(this.videoTitle.length > 0 && this.thumbnailUploaded){
      this.error = false;
    }
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  toggleHover(event: boolean){
    this.isHovering = event;
  }

  startUpload(drop: File){
    if (drop != null){
      console.log("dropped");

      const file = drop[0];
      // this.urlFile = URL.createObjectURL(file);
      console.log("name: " + file.name);
      this.videoTitle = this.formatVideoName(file.name);
      if(this.validateFile(file.name)){
        var video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          this.videoDuration = Math.floor(video.duration);
          this.duration = this.data.formatVideoDuration(this.videoDuration);
          console.log(this.videoDuration);
          this.createVideo();
        }

        video.src = URL.createObjectURL(file);

        this.filename = "video";
        this.dropped = true;
        const path = `video/${new Date().getTime()}_${this.filename}`;
        const ref = this.storage.ref(path);

        this.task = this.storage.upload(path, file);

        this.percentage = this.task.percentageChanges();
        this.snapshot = this.task.snapshotChanges().pipe(
          tap(console.log),

          finalize( async() => {
            this.downloadURL = await ref.getDownloadURL().toPromise(); 
            this.uploadDone = true;
            this.videoPath = this.downloadURL + this.filename;
            console.log("path: " + path);
            console.log("videoPath: " + this.videoPath);
            console.log("url: " + this.downloadURL);
          })

        );
        
      }else{
        console.log("not video type");
        return;
      }
    }
  }

  uploadThumbnail(drop: File){
    if (drop != null){
      console.log("dropped");

      const file = drop[0];
      console.log(file);
      console.log(file.name);
      if(this.validateThumbnail(file.name)){
        console.log("thumbnail");
        this.thumbnailName = ("thumbnail");
        const path = `thumbnail/${new Date().getTime()}_${this.thumbnailName}`;
        const ref = this.storage.ref(path);

        this.thumbnailTask = this.storage.upload(path, file);

        this.thumbnailPercentage = this.thumbnailTask.percentageChanges();
        this.thumbnailSnap = this.thumbnailTask.snapshotChanges().pipe(
          tap(console.log),

          finalize( async() => {
            this.thumbnailDownloadURL = await ref.getDownloadURL().toPromise(); 
            this.thumbnailUploaded = true;
            this.thumbnailPath = this.thumbnailDownloadURL + this.thumbnailName;
          })

        );
        
      }else{
        console.log("not image type");
        return;
      }
    }
  }

  isActive(snapshot){
    return snapshot.state === 'running' &&
    snapshot.bytesTransferred < snapshot.totalBytes;
  }

  validateFile(name: string): boolean {
    const ext = name.substring(name.lastIndexOf('.') + 1);
    if (ext.toLowerCase() == 'mp4') {
        return true;
    }
    else if (ext.toLowerCase() == 'flv') {
      return true;
    }
    else if (ext.toLowerCase() == 'm3u8') {
      return true;
    }
    else if (ext.toLowerCase() == 'ts') {
      return true;
    }
    else if (ext.toLowerCase() == '3gp') {
      return true;
    }
    else if (ext.toLowerCase() == 'mov') {
      return true;
    }
    else if (ext.toLowerCase() == 'avi') {
      return true;
    }
    else if (ext.toLowerCase() == 'wmv') {
      return true;
    }
    else if (ext.toLowerCase() == 'mkv') {
      return true;
    }
    else if (ext.toLowerCase() == 'm4v') {
      return true;
    }
    else {
        return false;
    }
  }

  validateThumbnail(name: string): boolean {
    const ext = name.substring(name.lastIndexOf('.') + 1);
    if (ext.toLowerCase() == 'jpg') {
        return true;
    }
    else if (ext.toLowerCase() == 'jpeg') {
      return true;
    }
    else if (ext.toLowerCase() == 'png') {
      return true;
    }
    else if (ext.toLowerCase() == 'tif') {
      return true;
    }
    else if (ext.toLowerCase() == 'gif') {
      return true;
    }
    else {
        return false;
    }
  }

  formatSizeUnits(bytes) {
    var marker = 1024; // Change to 1000 if required
    var decimal = 2; // Change as required
    var kiloBytes = marker; // One Kilobyte is 1024 bytes
    var megaBytes = marker * marker; // One MB is 1024 KB
    var gigaBytes = marker * marker * marker; // One GB is 1024 MB

    // return bytes if less than a KB
    if(bytes < (kiloBytes - (24 * bytes))) return bytes + " Bytes";
    // return KB if less than a MB
    else if(bytes < (megaBytes - (24 * kiloBytes))) return(bytes / kiloBytes).toFixed(decimal) + " KB";
    // return MB if less than a GB
    else if(bytes < (gigaBytes - (24 * megaBytes))) return(bytes / megaBytes).toFixed(decimal) + " MB";
    // return GB if less than a TB
    else return(bytes / gigaBytes).toFixed(decimal) + " GB";
  }

  formatPercentage(pct){
    return pct.toFixed(1);
  }

  formatVideoName(name: string): string{
    return name.substring(0, name.lastIndexOf('.'));
  }

  changeSection(sec){
    if(sec == 1){
      this.first = true;
      this.second = false;
    }else{
      this.validateFirstSection();
    }
  }

  selectedRestrict(event: any){
    let val = event.target.value;
    if(val == 'yes'){
      this.ageRestrict = true;
    }else{
      this.ageRestrict = false;
    }
  }

  selectedPrivacy(event: any){
    this.videoPrivacy = event.target.value;
    if(this.videoPrivacy == 'private'){
      this.videoPremium = false;
    }
  }

  selectedPremium(event: any){
    let val = event.target.value;
    if(val == 'premium'){
      this.videoPremium = true;
    }else{
      this.videoPremium = false;
    }
  }

  validateFirstSection(){
    this.videoDesc = (<HTMLInputElement>document.getElementById("input-description")).value;
    console.log(this.videoDesc);
    this.videoCategory = (<HTMLInputElement>document.getElementById("input-category")).value;
    console.log(this.videoCategory);
    console.log(this.ageRestrict);
    this.error = false;

    if(this.videoTitle.length == 0){
      this.error = true;
    }else if(!this.thumbnailUploaded){
      document.getElementById("view-thumbnail").style.color = "red";
      this.error = true;
    }

    if(this.error == false){
      this.first = false;
      this.second = true;
    }
  }

  getOneChannel(){
    this.apollo.query<any>({
      query: gql `
        query GetOneChannelByUser($user_id: Int!){
          getOneChannelByUser(user_id: $user_id){
            id
            user_id
            name
            description
            stats
            subscriber
            day
            month
            year
            icon_path
            art_path
            channel_link
          }
        }
      `,
      variables:{
        user_id: this.user.id
      }
    }).subscribe(result => {
      this.channel = result.data.getOneChannelByUser;
      console.log(this.channel);
    },(error)=>{
      //gaada channel
    })
  }

  createVideo(){
    this.apollo.mutate({
      mutation: gql `
        mutation CreateVideo($channel_id: Int!, $title: String!, $description: String!, $views: Int!,
          $like: Int!, $dislike: Int!, $comment: Int!, $visibility: String!, $restrict: String!,
          $day: Int!, $month: Int!, $year: Int!, $hours: Int!, $minutes: Int!, $seconds: Int!, 
          $video_path: String!, $thumbnail_path: String!, $category: String!, $location: String!, 
          $premium: String!, $duration: Int!){
            createVideo(input:{channel_id: $channel_id, title: $title, description: $description, 
              views: $views, like: $like, dislike: $dislike, comment: $comment, visibility: $visibility, 
              restrict: $restrict, day: $day, month: $month, year: $year, hours: $hours, minutes: $minutes, seconds: $seconds, 
              video_path: $video_path, thumbnail_path: $thumbnail_path, category: $category, location: $location, 
              premium: $premium, duration: $duration}){
                id
                channel_id
                title
                description
                views
                like
                dislike
                comment
                visibility
                restrict
                day
                month
                year
                hours
                minutes
                seconds
                video_path
                thumbnail_path
                category
                location
                premium
                duration
              }
        }
      `,
      variables:{
        channel_id: this.channel.id,
        title: this.videoTitle,
        description: "",
        views: 0,
        like: 0,
        dislike: 0,
        comment: 0,
        visibility: "private",
        restrict: "false",
        day: new Date().getDate(),
        month: (new Date().getMonth() + 1),
        year: new Date().getFullYear(),
        hours: new Date().getHours(),
        minutes: new Date().getMinutes(),
        seconds: new Date().getSeconds(),
        video_path: "",
        thumbnail_path: "",
        category: "",
        location: this.user.location,
        premium: "false",
        duration: this.videoDuration,
      }
    }).subscribe(result => {
      this.video = result.data;
      this.video = this.video.createVideo;
      this.videoLink = this.videoLink + this.video.id + "/";
      console.log(this.video);
    },(error)=>{
      console.log(error);
    })
  }

  updateVideo(){
    console.log(this.ageRestrict.toString());
    console.log(this.videoPremium.toString());
    this.apollo.mutate({
      mutation: gql `
        mutation UpdateVideo($id: ID!, $channel_id: Int!, $title: String!, $description: String!, $views: Int!,
          $like: Int!, $dislike: Int!, $comment: Int!, $visibility: String!, $restrict: String!,
          $day: Int!, $month: Int!, $year: Int!, $hours: Int!, $minutes: Int!, $seconds: Int!, $video_path: String!, 
          $thumbnail_path: String!, $category: String!, $location: String!, $premium: String!, $duration: Int!){
            updateVideo(id: $id, input:{channel_id: $channel_id, title: $title, description: $description, 
              views: $views, like: $like, dislike: $dislike, comment: $comment, visibility: $visibility, 
              restrict: $restrict, day: $day, month: $month, year: $year, hours: $hours, minutes: $minutes, seconds: $seconds,
              video_path: $video_path, thumbnail_path: $thumbnail_path, category: $category, location: $location, 
              premium: $premium, duration: $duration}){
                id
                channel_id
                title
                description
                views
                like
                dislike
                comment
                visibility
                restrict
                day
                month
                year
                hours
                minutes
                seconds
                video_path
                thumbnail_path
                category
                location
                premium
                duration
              }
        }
      `,
      variables:{
        id: this.video.id,
        channel_id: this.channel.id,
        title: this.videoTitle,
        description: this.videoDesc,
        views: 0,
        like: 0,
        dislike: 0,
        comment: 0,
        visibility: this.videoPrivacy,
        restrict: this.ageRestrict.toString(),
        day: new Date().getDate(),
        month: (new Date().getMonth() + 1),
        year: new Date().getFullYear(),
        hours: new Date().getHours(),
        minutes: new Date().getMinutes(),
        seconds: new Date().getSeconds(),
        video_path: this.videoPath,
        thumbnail_path: this.thumbnailPath,
        category: this.videoCategory,
        location: this.user.location,
        premium: this.videoPremium.toString(),
        duration: this.videoDuration,
      },
      refetchQueries:[{
        query: this.GET_VIDEOS
      }]
    }).subscribe(result => {
      this.video = result.data;
      this.video = this.video.updateVideo;
      console.log(this.video);
      this.router.navigate(['/home']);
    },(error)=>{
      console.log(error);
    })
  }
}

