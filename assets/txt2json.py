import json
import sys
import os
class Txt2Json:
	def __init__(self):
		self.json={
			'vertices':{},
			'edges':{},
		}
	def ParseVertices(self,filename):
		f_vertex= open(filename);
		v=self.json['vertices'];
		i=0;
		for line in f_vertex:		
			v_pos=line.strip().split('\t')
			v[i]=map(float,v_pos[1:])
			i+=1;

	def ParseEdges(self,filename):
		f_edge=open(filename);
		e=self.json['edges'];
		i=0
		for line in f_edge:
			edge_v=line.strip().split('\t')
		 	e[i]=map(int,edge_v[1:])
		 	i+=1;



def store(jsondata,filename):
    with open(filename, 'w') as f:
        f.write(json.dumps(jsondata,sort_keys=True,indent=4));
 
if __name__ == "__main__":
	if len(sys.argv)>1:
		foldername=sys.argv[1];
		# foldername = "test";
		Parse=Txt2Json();
		if os.path.exists(foldername+"/v.txt")==False or os.path.exists(foldername+"/e.txt")==False:
			print "The files doesn't exist.";
		Parse.ParseVertices(foldername+"/v.txt");
		Parse.ParseEdges(foldername+"/e.txt");
		store(Parse.json,foldername+'.json');