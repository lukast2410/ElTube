import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ActivatedRoute } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

@Component({
  selector: 'app-reply',
  templateUrl: './reply.component.html',
  styleUrls: ['./reply.component.scss']
})
export class ReplyComponent implements OnInit {
  @Output() replyComment = new EventEmitter<any>();
  @Output() act = new EventEmitter<any>();
  @Input() reply;

  GET_REPLY = gql `
    query GetReply($comment_id: Int!){
      getReply(comment_id: $comment_id){
        id
        user_id
        video_id
        like
        dislike
        day
        month
        year
        hours
        minutes
        seconds
        comment_id
        content
      }
    }
  `

  GET_COMMENT = gql `
    query GetComment($video_id: Int!){
      getComment(video_id: $video_id){
        id
        user_id
        video_id
        like
        dislike
        day
        month
        year
        hours
        minutes
        seconds
        comment_id
        content
      }
    }
  `

  inputReply: string = "";
  showReplyForm: boolean = false;
  replyUser;

  //user
  users = [];
  user = null;
  loggedIn = false;

  //activity
  like: boolean = false;
  dislike: boolean = false;

  constructor(private route: ActivatedRoute, private apollo: Apollo, public data: DataService) { }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
      this.checkActivity();
    }
    this.getReplyUser();
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  toggleReplyForm(word: string){
    this.showReplyForm = !this.showReplyForm;
    if(word == "cancel"){
      this.inputReply = "";
    }
  }

  createReply(){
    this.replyComment.emit(this.inputReply);
    this.toggleReplyForm("cancel");
  }

  getReplyUser(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetUser($id: ID!){
          getUser(id: $id){
            id
            name
            email
            photourl
            location
            restricted
            premium
          }
        }
      `,
      variables:{
        id: this.reply.user_id,
      }
    }).valueChanges.subscribe(result => {
      this.replyUser = result.data.getUser;
    })
  }

  likeDislikeReply(cond: string){
    let obj = {
      id: this.reply.id,
      cond: cond,
    }
    this.act.emit(obj);
  }
  
  checkActivity(){
    this.apollo.query<any>({
      query: gql `
        query CheckActivity($cond: String!, $to: String!, $from: String!){
          checkActivity(cond: $cond, to: $to, from: $from){
            to
            from
            tipe
          }
        }
      `,
      variables:{
        cond: "comment",
        to: this.reply.id,
        from: this.user.id,
      }
    }).subscribe(result => {
      let res = result.data.checkActivity;
      if(res.tipe == "Like Comment"){
        this.like = true;
        this.dislike = false;
      }else if(res.tipe == "Dislike Comment"){
        this.dislike = true;
        this.like = false;
      }else{
        this.like = false;
        this.dislike = false;
      }
    })
  }
}
