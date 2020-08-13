import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-community-post',
  templateUrl: './community-post.component.html',
  styleUrls: ['./community-post.component.scss']
})
export class CommunityPostComponent implements OnInit {
  @Input() channel;
  @Input() ps;

  GET_ACTIVITY = gql `
  query CheckActivity($cond: String!, $to: String!, $from: String!){
    checkActivity(cond: $cond, to: $to, from: $from){
      to
      from
      tipe
    }
  } `

  GET_POST = gql `
    query GetOnePost($id: ID!){
      getOnePost(id: $id){
        id
        channel_id
        picture_path
        content
        like
        dislike
        day
        month
        year
        hours
        minutes
        seconds
      }
    }
  `

  //user
  users = [];
  user = null;
  loggedIn: boolean = false;

  like: boolean;
  dislike: boolean;
  actProgress: boolean;
  constructor(private apollo: Apollo, private route: ActivatedRoute, private router: Router,
    public data: DataService) { }

  ngOnInit(): void {
    if(localStorage.getItem('users') == null){
      this.users = [];
    }
    else{
      this.getUserFromStorage();
    }

    this.like = false;
    this.dislike = false;
    this.actProgress = true;
    this.getOnePost();
  }

  getUserFromStorage(){
    this.users = JSON.parse(localStorage.getItem('users'));
    this.user = this.users[0];
    this.loggedIn = true;
  }

  likeDislikeVideo(word: string){
    if(this.user != null){
      if(word == "like" && this.actProgress){
        this.checkActivity(this.ps.id.toString(), this.user.id.toString(), "post", "like post", this.ps.id);
      }else if(word == "dislike" && this.actProgress){
        this.checkActivity(this.ps.id.toString(), this.user.id.toString(), "post", "dislike post", this.ps.id);
      }
    }
  }

  getOnePost(){
    this.apollo.watchQuery<any>({
      query: gql `
        query GetOnePost($id: ID!){
          getOnePost(id: $id){
            id
            channel_id
            picture_path
            content
            like
            dislike
            day
            month
            year
            hours
            minutes
            seconds
          }
        }
      `,
      variables:{
        id: this.ps.id,
      }
    }).valueChanges.subscribe(result => {
      this.ps = result.data.getOnePost;
      if(this.user != null){
        this.checkActivity(this.ps.id.toString(), this.user.id.toString(), "post", "check", this.ps.id);
      }
    })
  }

  checkActivity(to: string, from: string, cond: string, table: string, id: number){
    if(this.actProgress){
      this.actProgress = false;
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
        this.afterCheckActivity(result.data.checkActivity, cond, table, id);
      })
    }
  }

  afterCheckActivity(obj: any, cond: string, table: string, id: number){
    if(cond == "post"){
      if(obj.tipe == "Like Post"){
        console.log("Found you have like it table : " + table);
        if(table == "like post"){
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);
          this.like = false;
        }else if(table == "dislike post"){
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.createActivity(cond, this.ps.id, this.user.id, "Dislike Post");
          this.doActivity("like post reverse", id, -1);
          this.like = false;
          this.dislike = true;
        }else{
          console.log("checking");
          this.like = true;
          this.actProgress = true;
        }
      }else if(obj.tipe == "Dislike Post"){
        console.log("Found you have dislike it : " + table)
        if(table == "like post"){
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.createActivity(cond, this.ps.id, this.user.id, "Like Post");
          this.doActivity("like post reverse", id, 1);
          this.like = true;
          this.dislike = false;         
        }else if(table == "dislike post"){
          this.deleteActivity(cond, obj.to, obj.from, obj.tipe);
          this.doActivity(table, id, -1);   
          this.dislike = false;       
        }else{
          console.log("checking");
          this.dislike = true;
          this.actProgress = true;
        }
      }else if(obj.tipe == ""){
        console.log("Not found like or dislike")
        if(table == "like post"){
          this.createActivity(cond, this.ps.id, this.user.id, "Like Post");
          this.doActivity(table, this.ps.id, 1);
          this.like = true;
        }else if(table == "dislike post"){    
          this.createActivity(cond, this.ps.id, this.user.id, "Dislike Post");
          this.doActivity(table, this.ps.id, 1);
          this.dislike = true;
        }else{
          console.log("check");
          this.like = false;
          this.dislike = false;
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
        query: this.GET_POST
        ,variables:{
          id: this.ps.id,
        }
      }]
    }).subscribe(result => {
      console.log("activity done: " + table + " added " + doing);
      this.actProgress = true;
    })
  }
}
