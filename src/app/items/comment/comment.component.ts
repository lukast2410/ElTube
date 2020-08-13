import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ActivatedRoute } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';

@Component({
  selector: 'app-comment',
  templateUrl: './comment.component.html',
  styleUrls: ['./comment.component.scss']
})
export class CommentComponent implements OnInit {
  @Input() comment;
  @Output() act = new EventEmitter<any>();
  like: boolean = false;
  dislike: boolean = false;

  GET_ACTIVITY = gql `
    query CheckActivity($cond: String!, $to: String!, $from: String!){
      checkActivity(cond: $cond, to: $to, from: $from){
        to
        from
        tipe
      }
    } `

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

  inputReply: string = "";
  showReplyForm: boolean = false;
  commentUser;
  replies = [];
  showReply: boolean = false;

  //user
  users = [];
  user = null;
  loggedIn = false;

  //activity
  actProgress: boolean = true;

  constructor(private route: ActivatedRoute, private apollo: Apollo, public data: DataService) { }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
      this.checkActivity(this.comment.id, this.user.id, "comment", "check", parseInt(this.comment.id));
    }
    this.getCommentUser();
    this.getReply();
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  likeDislikeComment(cond: string){
    let o = {
      id: this.comment.id,
      cond: cond,
    }
    this.act.emit(o);
  }

  toggleReplyForm(word: string){
    this.showReplyForm = !this.showReplyForm;
    if(word == "cancel"){
      this.inputReply = "";
      this.showReplyForm = false;
    }
  }

  getCommentUser(){
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
        id: this.comment.user_id,
      }
    }).valueChanges.subscribe(result => {
      this.commentUser = result.data.getUser;
    })
  }
  
  likeDislikeReply(obj){
    console.log(obj.id);
    let idx = this.replies.map(function(item) { return item.id; }).indexOf(obj.id);
    if(idx >= 0 && this.actProgress){
      this.checkActivity(obj.id.toString(), this.user.id.toString(), "comment", obj.cond, parseInt(obj.id));
    }
  }

  checkActivity(to: string, from: string, cond: string, table: string, id: number){
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
          cond: cond,
          to: to,
          from: from,
        }
      }).subscribe(result => {
        let res = result.data.checkActivity;
        if(res.to == this.comment.id){
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
        }
        this.afterCheckActivity(result.data.checkActivity, cond, table, id);
      })
  }

  afterCheckActivity(obj: any, cond: string, table: string, id: number){
    if(cond == "comment"){
      // console.log(obj);
      if(obj.tipe == "Like Comment"){
        console.log("Found you have like it table : " + table);
        if(table == "like comment" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);
        }else if(table == "dislike comment" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.createActivity(cond, id.toString(), this.user.id, "Dislike Comment");
          this.doActivity("like reverse comment", id, -1);
        }else{
          console.log("checking");
          this.actProgress = true;
        }
      }else if(obj.tipe == "Dislike Comment"){
        console.log("Found you have dislike it : " + table)
        if(table == "like comment" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.createActivity(cond, id.toString(), this.user.id, "Like Comment");
          this.doActivity("like reverse comment", id, 1);   
        }else if(table == "dislike comment" && this.actProgress){
          this.actProgress = false;
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);  
        }else{
          console.log("checking");
          this.actProgress = true;
        }
      }else if(obj.tipe == ""){
        console.log("Not found like or dislike")
        if(table == "like comment" && this.actProgress){
          this.actProgress = false;
          this.createActivity(cond, id.toString(), this.user.id, "Like Comment");
          this.doActivity(table, id, 1);
        }else if(table == "dislike comment" && this.actProgress){
          this.actProgress = false;    
          this.createActivity(cond, id.toString(), this.user.id, "Dislike Comment");
          this.doActivity(table, id, 1);
        }else{
          console.log("check");
          this.actProgress = true;
        }
      }
    }
  }

  createActivity(cond: string, to: string, from: string, tipe: string){
    this.apollo.mutate({
      mutation: gql `
        mutation CreateActivity ($to: String!, $from: String!, $tipe: String!){
          createActivity(input: {to: $to, from: $from, tipe: $tipe}){
            to
            from
            tipe    
          }
        }
      `,
      variables:{
        to: to,
        from: from,
        tipe: tipe,
      },
      refetchQueries:[{
        query: this.GET_ACTIVITY,
        variables:{
          cond: cond,
          to: to,
          from: from,
        }
      }]
    }).subscribe(result => {
      console.log("created activity: " + tipe);
    })
  }

  deleteActivity(cond: string, to: string, from: string, tipe: string){
    this.apollo.mutate({
      mutation: gql `
        mutation DeleteActivity ($to: String!, $from: String!, $tipe: String!){
          deleteActivity(input: {to: $to, from: $from, tipe: $tipe})
        }
      `,
      variables:{
        to: to,
        from: from,
        tipe: tipe,
      },
      refetchQueries:[{
        query: this.GET_ACTIVITY,
        variables:{
          cond: cond,
          to: to,
          from: from,
        }
      }]
    }).subscribe(result => {
      console.log("deleted activity: " + tipe);
    })
  }

  doActivity(table: string, id: number, doing: number){
    if(table.includes("comment")){
      this.apollo.mutate({
        mutation: gql `
          mutation DoActivity ($table: String!, $id: ID!, $do: Int!){
            doActivity(table: $table, id: $id, do: $do)
          }
        `,
        variables:{
          table: table,
          id: id,
          do: doing,
        },
        refetchQueries:[{
          query: this.GET_REPLY
          ,variables:{
            comment_id: parseInt(this.comment.id),
          }
        }]
      }).subscribe(result => {
        console.log("activity done: " + table + " added " + doing);
        console.log("comment like or dislike updated");
        this.actProgress = true;
      })
    }
  }
 
//   checkActivity(){
//     this.apollo.query<any>({
//       query: gql `
//         query CheckActivity($cond: String!, $to: String!, $from: String!){
//           checkActivity(cond: $cond, to: $to, from: $from){
//             to
//             from
//             tipe
//           }
//         }
//       `,
//       variables:{
//         cond: "comment",
//         to: this.comment.id,
//         from: this.user.id,
//       }
//     }).subscribe(result => {
//       let res = result.data.checkActivity;
//       if(res.tipe == "Like Comment"){
//         this.like = true;
//         this.dislike = false;
//       }else if(res.tipe == "Dislike Comment"){
//         this.dislike = true;
//         this.like = false;
//       }else{
//         this.like = false;
//         this.dislike = false;
//       }
//     })
// }

  replyComment(){
    this.createReply(this.inputReply);
  }

  replyReply(content){
    this.createReply(content);
  }

  showReplies(){
    this.showReply = !this.showReply;
  }
  
  createReply(word: string){
    if(word == ""){
      return;
    }
    this.apollo.mutate({
      mutation: gql `
        mutation CreateComment($user_id: Int!, $video_id: Int!, $like: Int!, $dislike: Int!, $day: Int!,
          $month: Int!, $year: Int!, $hours: Int!, $minutes: Int!, $seconds: Int!, $comment_id: Int!, 
          $content: String!){
          createComment(input: {
            user_id: $user_id,
            video_id: $video_id,
            like: $like,
            dislike: $dislike,
            day: $day,
            month: $month,
            year: $year,
            hours: $hours,
            minutes: $minutes,
            seconds: $seconds,
            comment_id: $comment_id,
            content: $content,
          }){
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
      `,
      variables:{
        user_id: this.user.id,
        video_id: this.comment.video_id,
        like: 0,
        dislike: 0,
        day: new Date().getDate(),
        month: (new Date().getMonth() + 1),
        year: new Date().getFullYear(),
        hours: new Date().getHours(),
        minutes: new Date().getMinutes(),
        seconds: new Date().getSeconds(),
        comment_id: this.comment.id,
        content: word,
      },
      refetchQueries:[{
        query: this.GET_REPLY
        ,variables:{
          comment_id: this.comment.id,
        }
      }]
    }).subscribe(result => {
      console.log("create comment successfull");
      this.toggleReplyForm('cancel');
    })
  }

  getReply(){
    this.apollo.watchQuery<any>({
      query: gql `
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
      `,
      variables:{
        comment_id: this.comment.id,
      }
    }).valueChanges.subscribe(result => {
      this.replies = result.data.getReply;
    })
  }
}
